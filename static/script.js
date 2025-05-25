let chart;
let currentData = [];
let originalData = [];
let animationTimeout = null;
let isSorting = false;
let isPaused = false;
let currentStep = 0;
let sortingSteps = [];

// Initialize Chart
function initChart(data) {
    const ctx = document.getElementById('chart').getContext('2d');
    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map((_, i) => i + 1),
            datasets: [{
                data: data,
                backgroundColor: data.map(() => getColor('normal')),
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true },
                x: { grid: { display: false } }
            },
            plugins: {
                legend: { display: false },
                datalabels: {
                    color: '#000',
                    anchor: 'end',
                    align: 'start',
                    font: { weight: 'bold', size: 12 },
                    formatter: value => value
                }
            },
            animation: {
                duration: 500,
                easing: 'easeOutQuart'
            }
        },
        plugins: [ChartDataLabels]
    });
}

// Color mapping
function getColor(type) {
    const colors = {
        'normal': 'rgba(54, 162, 235, 0.7)',
        'comparing': 'rgba(255, 206, 86, 0.7)',
        'swapping': 'rgba(255, 99, 132, 0.7)',
        'sorted': 'rgba(75, 192, 192, 0.7)'
    };
    return colors[type] || colors['normal'];
}

async function generateNewArray() {
    if (isSorting && !isPaused) return;
    const size = document.getElementById('size').value;
    const response = await fetch('/generate_data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `size=${size}`
    });
    currentData = await response.json();
    originalData = [...currentData];
    resetVisualization();
    initChart(currentData);
}

async function performSort() {
    if (isSorting) return;

    document.getElementById('sort-btn').textContent = 'Preparing...';
    document.getElementById('sort-btn').disabled = true;

    setTimeout(async () => {
        const algorithm = document.getElementById('algorithm').value;
        const speed = document.getElementById('speed').value;

        if (currentData.every((val, i, arr) => i === 0 || arr[i - 1] <= val)) {
            alert("Array is already sorted!");
            document.getElementById('sort-btn').disabled = false;
            document.getElementById('sort-btn').textContent = 'Sort';
            return;
        }

        document.getElementById('sort-btn').textContent = 'Sorting...';
        document.getElementById('generate-btn').disabled = true;
        document.getElementById('pause-btn').disabled = false;
        isSorting = true;

        const response = await fetch('/sort', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `algorithm=${algorithm}&speed=${speed}&${currentData.map((val) => `data[]=${val}`).join('&')}`
        });

        sortingSteps = await response.json();
        currentStep = 0;

        document.getElementById('sort-btn').textContent = 'Sort';
        visualizeSorting();
    }, 0);
}

function visualizeSorting() {
    if (isPaused || currentStep >= sortingSteps.length) {
        if (currentStep >= sortingSteps.length) sortingComplete();
        return;
    }

    const step = sortingSteps[currentStep];
    updateChart(step.data, step.compared, step.action);
    currentStep++;

    const speed = parseFloat(document.getElementById('speed').value) * 1000;
    animationTimeout = setTimeout(visualizeSorting, speed);
}

function updateChart(data, compared = [], action = 'normal') {
    const colors = data.map(() => getColor('normal'));

    if (compared.length > 0) {
        compared.forEach(idx => {
            if (idx >= 0 && idx < colors.length) {
                colors[idx] = getColor(action === 'swap' ? 'swapping' : 'comparing');
            }
        });
    }

    if (currentStep === sortingSteps.length - 1) {
        colors.fill(getColor('sorted'));
    }

    chart.data.datasets[0].data = data;
    chart.data.datasets[0].backgroundColor = colors;
    chart.update();
}

function sortingComplete() {
    isSorting = false;
    document.getElementById('sort-btn').disabled = false;
    document.getElementById('generate-btn').disabled = false;
    document.getElementById('pause-btn').disabled = true;
    document.getElementById('pause-btn').textContent = 'Pause';
    isPaused = false;
    updateChart(currentData, [], 'sorted');
    alert("Sorting is complete. You can generate a new array or reset.");
}

function togglePause() {
    if (!isSorting) return;
    isPaused = !isPaused;
    document.getElementById('pause-btn').textContent = isPaused ? 'Resume' : 'Pause';
    if (!isPaused) visualizeSorting();
    else clearTimeout(animationTimeout);
}

function resetVisualization() {
    clearTimeout(animationTimeout);
    isSorting = false;
    isPaused = false;
    currentStep = 0;
    sortingSteps = [];

    document.getElementById('sort-btn').disabled = false;
    document.getElementById('generate-btn').disabled = false;
    document.getElementById('pause-btn').disabled = true;
    document.getElementById('pause-btn').textContent = 'Pause';

    if (originalData.length > 0) {
        currentData = [...originalData];
        initChart(currentData);
    }
}

// Event listeners
document.getElementById('generate-btn').addEventListener('click', generateNewArray);
document.getElementById('sort-btn').addEventListener('click', performSort);
document.getElementById('pause-btn').addEventListener('click', togglePause);
document.getElementById('reset-btn').addEventListener('click', resetVisualization);

document.getElementById('size').addEventListener('input', function () {
    document.getElementById('size-value').textContent = this.value;
});

document.getElementById('speed').addEventListener('input', function () {
    document.getElementById('speed-value').textContent = this.value;
});

// On load
window.addEventListener('load', generateNewArray);
