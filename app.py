from flask import Flask, render_template, request, jsonify,url_for,redirect
import random

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate_data', methods=['POST'])
def generate_data():
    size = int(request.form.get('size', 20))
    data = random.sample(range(10, 500), size)
    return jsonify(data)

@app.route('/sort', methods=['POST'])
def sort_array():
    data = list(map(int, request.form.getlist('data[]')))
    algorithm = request.form.get('algorithm', 'bubble')

    steps = []
    if algorithm == 'bubble':
        steps = bubble_sort(data.copy())
    elif algorithm == 'selection':
        steps = selection_sort(data.copy())
    elif algorithm == 'insertion':
        steps = insertion_sort(data.copy())
    elif algorithm == 'merge':
        steps = merge_sort(data.copy())
    elif algorithm == 'quick':
        steps = quick_sort(data.copy())
    else:
        return jsonify({'error': 'Unsupported algorithm'}), 400

    return jsonify(steps)

def record_step(data, compared=None, action='normal'):
    return {
        'data': data.copy(),
        'compared': compared or [],
        'action': action
    }

def bubble_sort(arr):
    steps = []
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            steps.append(record_step(arr, [j, j + 1], 'compare'))
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                steps.append(record_step(arr, [j, j + 1], 'swap'))
    steps.append(record_step(arr, [], 'sorted'))
    return steps

def selection_sort(arr):
    steps = []
    n = len(arr)
    for i in range(n):
        min_idx = i
        for j in range(i + 1, n):
            steps.append(record_step(arr, [min_idx, j], 'compare'))
            if arr[j] < arr[min_idx]:
                min_idx = j
        if min_idx != i:
            arr[i], arr[min_idx] = arr[min_idx], arr[i]
            steps.append(record_step(arr, [i, min_idx], 'swap'))
    steps.append(record_step(arr, [], 'sorted'))
    return steps

def insertion_sort(arr):
    steps = []
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        while j >= 0 and key < arr[j]:
            steps.append(record_step(arr, [j, j + 1], 'compare'))
            arr[j + 1] = arr[j]
            steps.append(record_step(arr, [j, j + 1], 'swap'))
            j -= 1
        arr[j + 1] = key
        steps.append(record_step(arr, [j + 1], 'swap'))
    steps.append(record_step(arr, [], 'sorted'))
    return steps

def merge_sort(arr):
    steps = []
    def merge_sort_recursive(arr, l, r):
        if l >= r:
            return
        mid = (l + r) // 2
        merge_sort_recursive(arr, l, mid)
        merge_sort_recursive(arr, mid + 1, r)
        merge(arr, l, mid, r)

    def merge(arr, l, mid, r):
        left = arr[l:mid + 1]
        right = arr[mid + 1:r + 1]
        i = j = 0
        k = l
        while i < len(left) and j < len(right):
            steps.append(record_step(arr, [k], 'compare'))
            if left[i] <= right[j]:
                arr[k] = left[i]
                i += 1
            else:
                arr[k] = right[j]
                j += 1
            steps.append(record_step(arr, [k], 'swap'))
            k += 1
        while i < len(left):
            arr[k] = left[i]
            steps.append(record_step(arr, [k], 'swap'))
            i += 1
            k += 1
        while j < len(right):
            arr[k] = right[j]
            steps.append(record_step(arr, [k], 'swap'))
            j += 1
            k += 1

    merge_sort_recursive(arr, 0, len(arr) - 1)
    steps.append(record_step(arr, [], 'sorted'))
    return steps

def quick_sort(arr):
    steps = []
    def partition(low, high):
        pivot = arr[high]
        i = low - 1
        for j in range(low, high):
            steps.append(record_step(arr, [j, high], 'compare'))
            if arr[j] <= pivot:
                i += 1
                arr[i], arr[j] = arr[j], arr[i]
                steps.append(record_step(arr, [i, j], 'swap'))
        arr[i + 1], arr[high] = arr[high], arr[i + 1]
        steps.append(record_step(arr, [i + 1, high], 'swap'))
        return i + 1

    def quick_sort_recursive(low, high):
        if low < high:
            pi = partition(low, high)
            quick_sort_recursive(low, pi - 1)
            quick_sort_recursive(pi + 1, high)

    quick_sort_recursive(0, len(arr) - 1)
    steps.append(record_step(arr, [], 'sorted'))
    return steps

if __name__ == '__main__':
    app.run(debug=True)
