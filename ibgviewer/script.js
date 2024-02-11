function read_file(fileContent) {
    const lines = fileContent.split('\n');

    let config_data = {};
    let current_section = null;
    let write_data_set = [];
    let verify_data_set = [];
    let configuration_data = {};

    for (const line of lines) {
        const trimmedLine = line.trim();

        if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
            current_section = trimmedLine.substring(1, trimmedLine.length - 1);
            config_data[current_section] = {};
        } else if (current_section) {
            const parts = trimmedLine.split('=');
            if (parts.length === 2) {
                const [key, value] = parts;
                config_data[current_section][key.trim()] = value.trim();
            }

            if (current_section === 'START_WRITE_GRAPH_VALUES' && trimmedLine !== '[START_WRITE_GRAPH_VALUES]') {
                write_data_set.push(trimmedLine.split(',').map(val => parseFloat(val)));
            }

            if (current_section === 'START_VERIFY_GRAPH_VALUES' && trimmedLine !== '[START_VERIFY_GRAPH_VALUES]') {
                verify_data_set.push(trimmedLine.split(',').map(val => parseFloat(val)));
            }

            if (current_section === 'START_CONFIGURATION' && trimmedLine !== '[START_CONFIGURATION]') {
                const configParts = trimmedLine.split('=');
                if (configParts.length === 2) {
                    const [configKey, configValue] = configParts;
                    configuration_data[configKey.trim()] = configValue.trim();
                }
            }
        }
    }

    config_data['write_graph_values'] = write_data_set;
    config_data['verify_graph_values'] = verify_data_set;
    config_data['START_CONFIGURATION'] = configuration_data;

    return config_data;
}

function processFile() {
    var fileInput = document.getElementById('fileInput');
    var resultDiv = document.getElementById('result');
    
    resultDiv.innerHTML = "";

    destroyCharts();

    if (fileInput.files.length > 0) {
        var file = fileInput.files[0];
        var reader = new FileReader();

        reader.onload = function (e) {
            var contents = e.target.result;
            var processedData = read_file(contents);

            console.log(processedData);

            resultDiv.textContent = "Processed Results:\n" + JSON.stringify(processedData, null, 2);			
					
			createDualAxisPlot(processedData['write_graph_values'], 'writePlotCanvas', 'Write Data', 0, 4, borderColorSpeed = "#AC3B61", borderColorCPU = "#E3AFBC");
			createDualAxisPlot(processedData['verify_graph_values'], 'verifyPlotCanvas', 'Verify Data', 0, 3, borderColorSpeed = "#4056A1", borderColorCPU = "#C5CBE3");

			
            displayConfiguration(processedData['START_CONFIGURATION']);
  
        };

        reader.readAsText(file);
    } else {
        resultDiv.textContent = "Please select a file.";
    }
}

function destroyCharts() {
    var writeCanvas = document.getElementById('writePlotCanvas');
    var verifyCanvas = document.getElementById('verifyPlotCanvas');
    var newWriteCanvas = document.getElementById('newWritePlotCanvas');
    var newVerifyCanvas = document.getElementById('newVerifyPlotCanvas');

    if (writeCanvas) {
        var writeChart = Chart.getChart(writeCanvas);
        if (writeChart) {
            writeChart.destroy();
        }
    }

    if (verifyCanvas) {
        var verifyChart = Chart.getChart(verifyCanvas);
        if (verifyChart) {
            verifyChart.destroy();
        }
    }

    if (newWriteCanvas) {
        var newWriteChart = Chart.getChart(newWriteCanvas);
        if (newWriteChart) {
            newWriteChart.destroy();
        }
    }

    if (newVerifyCanvas) {
        var newVerifyChart = Chart.getChart(newVerifyCanvas);
        if (newVerifyChart) {
            newVerifyChart.destroy();
        }
    }
}

function displayConfiguration(configurationData) {
    var resultDiv = document.getElementById('result');

    resultDiv.innerHTML = "";

    if (configurationData) {
        resultDiv.innerHTML += "<h2>Configuration Information</h2>";

        for (var key in configurationData) {
            if (configurationData.hasOwnProperty(key)) {
                resultDiv.innerHTML += "<p><strong>" + key + ":</strong> " + configurationData[key] + "</p>";
            }
        }
    } else {
        resultDiv.innerHTML += "<p>No configuration information found.</p>";
    }
}

function createDualAxisPlot(data, canvasId, label, speedColumnIndex, cpuColumnIndex, borderColorSpeed, borderColorCPU) {
    var ctx = document.getElementById(canvasId).getContext('2d');

    var xValues = data.map(entry => entry[1] * 2048 / (1024 * 1024 * 1024)); 
    var speedValues = data.map(entry => entry[speedColumnIndex]); 
    var cpuValues = data.map(entry => entry[cpuColumnIndex]);

    
    var myChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: label.slice(0, -5) + ' Speed',
                    yAxisID: 'y-axis-speed',
                    data: xValues.map((x, i) => ({ x, y: speedValues[i] })),
                    borderColor: borderColorSpeed,
                    borderWidth: 1,
                    pointRadius: 0,
                },
                {
                    label: label.slice(0, -5) + ' CPU%',
                    yAxisID: 'y-axis-cpu',
                    data: xValues.map((x, i) => ({ x, y: cpuValues[i] })),
                    borderColor: borderColorCPU,
                    borderWidth: 1,
                    pointRadius: 0,
                },
            ]
        },
        options: {
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: "Data (GB)"
                    }
                },
                
                'y-axis-speed': {
                    type: "linear",
                    position: "left",
                    title: {
                        display: true,
                        text: 'Speed (X)'
                    }
                },
                'y-axis-cpu': {
                    type: "linear",
                    position: "right",
                    title: {
                        display: true,
                        text: 'CPU %'
                    },
                    min: 0,
                    max: 100
                }
            }
        }
    });
}
