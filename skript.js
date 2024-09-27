let image = document.getElementById('originalImage');
let outputCanvas = document.getElementById('outputCanvas');
let ctx = outputCanvas.getContext('2d');
let imageData;

function loadImage() {
  let input = document.getElementById('imageInput');
  let file = input.files[0];
  let reader = new FileReader();
  reader.onload = function(e) {
    image.src = e.target.result;
    image.onload = function() {
      outputCanvas.width = image.width;
      outputCanvas.height = image.height;
      ctx.drawImage(image, 0, 0);
      imageData = ctx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
    }
  };
  reader.readAsDataURL(file);
}

function sharpenImage() {
    // Define the sharpening kernel
    let kernel = [
      [0, -1, 0],
      [-1, 5, -1],
      [0, -1, 0]
    ];
    let outputData = ctx.createImageData(outputCanvas.width, outputCanvas.height);
    for (let y = 0; y < outputCanvas.height; y++) {
      for (let x = 0; x < outputCanvas.width; x++) {
        let index = (y * outputCanvas.width + x) * 4;
        
        for (let channel = 0; channel < 3; channel++) {
          let sum = 0;
          
          for (let ky = 0; ky < 3; ky++) {
            for (let kx = 0; kx < 3; kx++) {
              let imgY = y + ky - 1;
              let imgX = x + kx - 1;
              
              if (imgY >= 0 && imgY < outputCanvas.height && imgX >= 0 && imgX < outputCanvas.width) {
                let imgIndex = (imgY * outputCanvas.width + imgX) * 4;
                sum += imageData.data[imgIndex + channel] * kernel[ky][kx];
              }
            }
          }
          outputData.data[index + channel] = Math.min(255, Math.max(0, sum)); // Ensure value is in [0, 255] range
        }
        outputData.data[index + 3] = 255; // Alpha channel
      }
    }
    ctx.putImageData(outputData, 0, 0);
  }
  

  function blurImage() {
    let radius = 2; // радиус размытия, можно изменить
    let data = imageData.data;
    let width = imageData.width;
    let height = imageData.height;
    
    // Создание временного массива, в который будет записано размытое изображение
    let blurredData = new Uint8ClampedArray(data.length);
  
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let red = 0, green = 0, blue = 0, alpha = 0;
        let count = 0;
  
        // Перебор всех пикселей в окрестности радиуса
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            let px = x + dx;
            let py = y + dy;
            if (px >= 0 && px < width && py >= 0 && py < height) {
              let idx = (py * width + px) * 4;
              red += data[idx];
              green += data[idx + 1];
              blue += data[idx + 2];
              alpha += data[idx + 3];
              count++;
            }
          }
        }
  
        let idx = (y * width + x) * 4;
        blurredData[idx] = red / count;
        blurredData[idx + 1] = green / count;
        blurredData[idx + 2] = blue / count;
        blurredData[idx + 3] = alpha / count;
      }
    }
  
    let blurredImageData = new ImageData(blurredData, width, height);
    ctx.putImageData(blurredImageData, 0, 0);
  }
  

  function embossImage() {
    let data = imageData.data;
    let width = imageData.width;
    let height = imageData.height;
    
    // Создаем временный массив для обработанного изображения
    let embossedData = new Uint8ClampedArray(data.length);
  
    // Применяем эффект тиснения к каждому пикселю
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Определяем индекс пикселя в массиве данных
        let idx = (y * width + x) * 4;
        
        // Если пиксель находится на краю изображения, оставляем его без изменений
        if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
          embossedData.set(data.subarray(idx, idx + 4), idx);
          continue;
        }
        
        // Вычисляем разницу между яркостью текущего пикселя и яркостью соседнего
        let rDiff = data[idx] - data[idx - 4];
        let gDiff = data[idx + 1] - data[idx - 3];
        let bDiff = data[idx + 2] - data[idx - 2];
        
        // Вычисляем новую яркость как среднее значение разницы и добавляем его к 128
        let brightness = (rDiff + gDiff + bDiff) / 3 + 128;
        embossedData[idx] = brightness;
        embossedData[idx + 1] = brightness;
        embossedData[idx + 2] = brightness;
        embossedData[idx + 3] = 255; // Устанавливаем максимальное значение для альфа-канала
      }
    }
  
    // Создаем новый объект ImageData и выводим обработанное изображение на холст
    let embossedImageData = new ImageData(embossedData, width, height);
    ctx.putImageData(embossedImageData, 0, 0);
  }

  function medianFilter() {
    let data = imageData.data;
    let width = imageData.width;
    let height = imageData.height;
  
    // Создаем временный массив для обработанного изображения
    let filteredData = new Uint8ClampedArray(data.length);
  
    // Определяем размер окна для медианной фильтрации (например, 3x3)
    let windowSize = 3;
    let halfSize = Math.floor(windowSize / 2);
  
    // Применяем медианную фильтрацию к каждому пикселю
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Определяем индекс пикселя в массиве данных
        let idx = (y * width + x) * 4;
  
        let values = [];
  
        // Собираем значения яркости пикселей в окне
        for (let offsetY = -halfSize; offsetY <= halfSize; offsetY++) {
          for (let offsetX = -halfSize; offsetX <= halfSize; offsetX++) {
            let neighborX = x + offsetX;
            let neighborY = y + offsetY;
  
            // Проверяем, что соседний пиксель в пределах изображения
            if (neighborX >= 0 && neighborX < width && neighborY >= 0 && neighborY < height) {
              let neighborIdx = (neighborY * width + neighborX) * 4;
              let brightness = data[neighborIdx]; // Берем только значение яркости красного канала для медианы
              values.push(brightness);
            }
          }
        }
  
        // Вычисляем медиану значений и устанавливаем ее в новое значение пикселя
        values.sort((a, b) => a - b);
        let medianIdx = Math.floor(values.length / 2);
        let medianValue = values[medianIdx];
  
        filteredData[idx] = medianValue; // Устанавливаем новое значение яркости
        filteredData[idx + 1] = filteredData[idx]; // Устанавливаем для остальных каналов то же значение
        filteredData[idx + 2] = filteredData[idx];
        filteredData[idx + 3] = 255; // Устанавливаем максимальное значение для альфа-канала
      }
    }
  
    // Создаем новый объект ImageData и выводим обработанное изображение на холст
    let filteredImageData = new ImageData(filteredData, width, height);
    ctx.putImageData(filteredImageData, 0, 0);
  }

  function cannyEdgeDetection() {
    // Гауссово размытие
    let blurredData = applyGaussianBlur(imageData);

    // Вычисление градиента
    let gradientData = computeGradient(blurredData);

    // Применение немаксимального подавления
    let nonMaxSuppressedData = applyNonMaxSuppression(gradientData);

    // Применение двойной пороговой фильтрации
    let thresholdedData = applyDoubleThresholding(nonMaxSuppressedData);

    // Отображение результата
    ctx.putImageData(thresholdedData,0,0);
}

function applyGaussianBlur(imageData) {
    let width = imageData.width;
    let height = imageData.height;
    let data = imageData.data;
    let blurredData = new Uint8ClampedArray(data.length);

    // Реализация гауссова размытия (простое усреднение окружающих пикселей)
    for (let y =0; y < height; y++) {
        for (let x =0; x < width; x++) {
            let index = (y * width + x) *4;
            let sumR =0, sumG =0, sumB =0, count =0;
            for (let dy = -1; dy <=1; dy++) {
                for (let dx = -1; dx <=1; dx++) {
                    let nx = x + dx, ny = y + dy;
                    if (nx >=0 && nx < width && ny >=0 && ny < height) {
                        let nIndex = (ny * width + nx) *4;
                        sumR += data[nIndex];
                        sumG += data[nIndex +1];
                        sumB += data[nIndex +2];
                        count++;
                    }
                }
            }
            blurredData[index] = sumR / count;
            blurredData[index +1] = sumG / count;
            blurredData[index +2] = sumB / count;
            blurredData[index +3] =255;
        }
    }

    return new ImageData(blurredData, width, height);
}

function computeGradient(imageData) {
    let width = imageData.width;
    let height = imageData.height;
    let data = imageData.data;
    let gradientData = new Uint8ClampedArray(data.length);

    // Матрицы для оператора Собеля
    let sobelX = [
        [-1,0,1],
        [-2,0,2],
        [-1,0,1]
    ];
    let sobelY = [
        [-1, -2, -1],
        [0,0,0],
        [1,2,1]
    ];

    for (let y =0; y < height; y++) {
        for (let x =0; x < width; x++) {
            let index = (y * width + x) *4;
            let gx =0, gy =0;

            // Вычисление градиента по X и Y
            for (let dy = -1; dy <=1; dy++) {
                for (let dx = -1; dx <=1; dx++) {
                    let nx = x + dx, ny = y + dy;
                    if (nx >=0 && nx < width && ny >=0 && ny < height) {
                        let nIndex = (ny * width + nx) *4;
                        gx += data[nIndex] * sobelX[dy +1][dx +1];
                        gy += data[nIndex] * sobelY[dy +1][dx +1];
                    }
                }
            }

            // Вычисление величины градиента
            let magnitude = Math.sqrt(gx * gx + gy * gy);
            gradientData[index] = magnitude; // Красный канал
            gradientData[index +1] = magnitude; // Зеленый канал
            gradientData[index +2] = magnitude; // Синий канал
            gradientData[index +3] =255; // Альфа канал
        }
    }

    return new ImageData(gradientData, width, height);
}

function applyNonMaxSuppression(imageData) {
    let width = imageData.width;
    let height = imageData.height;
    let data = imageData.data;
    let nonMaxSuppressedData = new Uint8ClampedArray(data.length);

    for (let y =0; y < height; y++) {
        for (let x =0; x < width; x++) {
            let index = (y * width + x) *4;
            let gradientIndex = index;
            let gradient = data[gradientIndex];

            // Вычисление направления градиента
            let dx = data[gradientIndex +1]; // Предполагаем, что зеленый канал содержит компоненту градиента по X
            let dy = data[gradientIndex +2]; // Предполагаем, что синий канал содержит компоненту градиента по Y
            let gradientDirection = Math.atan2(dy, dx);

            // Нормализация направления градиента к одному из четырех основных направлений
            gradientDirection = (gradientDirection <0) ? (gradientDirection + Math.PI) : gradientDirection;
            gradientDirection = Math.round((gradientDirection + Math.PI /8) / (Math.PI /4));

            // Проверка соседних пикселей в направлении градиента
            let check1, check2;
            if (gradientDirection ===0) {
                check1 = (x +1 < width) ? data[((y * width + x +1) *4) +3] :0;
                check2 = (x -1 >=0) ? data[((y * width + x -1) *4) +3] :0;
            } else if (gradientDirection ===1) {
                check1 = (y -1 >=0 && x +1 < width) ? data[(((y -1) * width + x +1) *4) +3] :0;
                check2 = (y +1 < height && x -1 >=0) ? data[(((y +1) * width + x -1) *4) +3] :0;
            } else if (gradientDirection ===2) {
                check1 = (y -1 >=0) ? data[(((y -1) * width + x) *4) +3] :0;
                check2 = (y +1 < height) ? data[(((y +1) * width + x) *4) +3] :0;
            } else {
                check1 = (y +1 < height && x +1 < width) ? data[(((y +1) * width + x +1) *4) +3] :0;
                check2 = (y -1 >=0 && x -1 >=0) ? data[(((y -1) * width + x -1) *4) +3] :0;
            }

            // Применение немаксимального подавления
            if (gradient < check1 || gradient < check2) {
                gradient =0;
            }

            nonMaxSuppressedData[index] = gradient;
            nonMaxSuppressedData[index +1] = gradient;
            nonMaxSuppressedData[index +2] = gradient;
            nonMaxSuppressedData[index +3] =255;
        }
    }

    return new ImageData(nonMaxSuppressedData, width, height);
}

function applyDoubleThresholding(imageData) {
    let width = imageData.width;
    let height = imageData.height;
    let data = imageData.data;
    let thresholdedData = new Uint8ClampedArray(data.length);

    // Нижний и верхний пороги
    let lowThreshold =50;
    let highThreshold =150;

    for (let y =0; y < height; y++) {
        for (let x =0; x < width; x++) {
            let index = (y * width + x) *4;
            let gradient = data[index];

            // Применение порогов
            if (gradient > highThreshold) {
                // Сильные границы
                thresholdedData[index] = gradient;
                thresholdedData[index +1] = gradient;
                thresholdedData[index +2] = gradient;
                thresholdedData[index +3] =255;
            } else if (gradient > lowThreshold) {
                // Возможные границы
                // Здесь нужно реализовать связность с уже обнаруженными границами
                // Для простоты, будем считать их границами
                thresholdedData[index] = gradient;
                thresholdedData[index +1] = gradient;
                thresholdedData[index +2] = gradient;
                thresholdedData[index +3] =255;
            } else {
                // Не границы
                thresholdedData[index] =0;
                thresholdedData[index +1] =0;
                thresholdedData[index +2] =0;
                thresholdedData[index +3] =255;
            }
        }
    }

    return new ImageData(thresholdedData, width, height);
}
  
function robertsEdgeDetection() {
    let width = imageData.width;
    let height = imageData.height;
    let data = imageData.data;
    let outputData = new Uint8ClampedArray(data.length);

    // Матрицы Робертса
    let robertsX = [
        [1,0],
        [0, -1]
    ];
    let robertsY = [
        [0,1],
        [-1,0]
    ];

    for (let y =0; y < height -1; y++) {
        for (let x =0; x < width -1; x++) {
            let index = (y * width + x) *4;
            let gx =0, gy =0;

            // Вычисление градиента по X и Y с использованием матриц Робертса
            for (let dy =0; dy <2; dy++) {
                for (let dx =0; dx <2; dx++) {
                    let nx = x + dx, ny = y + dy;
                    let nIndex = (ny * width + nx) *4;
                    gx += data[nIndex] * robertsX[dy][dx];
                    gy += data[nIndex] * robertsY[dy][dx];
                }
            }

            // Вычисление величины градиента
            let magnitude = Math.sqrt(gx * gx + gy * gy);
            outputData[index] = magnitude; // Красный канал
            outputData[index +1] = magnitude; // Зеленый канал
            outputData[index +2] = magnitude; // Синий канал
            outputData[index +3] =255; // Альфа канал
        }
    }

    let outputImageData = new ImageData(outputData, width, height);
    ctx.putImageData(outputImageData,0,0);
}