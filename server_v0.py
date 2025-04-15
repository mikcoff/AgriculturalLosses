from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import os

crop_types = ['alfalfa', 'corn_grain', 'corn_silage', 'cotton_upland', 'hay', 'rice', 'soybeans', 'spring_wheat', 'winter_wheat']
model_types = ['RandomForest', 'CatBoost', 'XGBoost']
models = {}
yield_units = {
    'alfalfa': 'Tons/Acre',
    'corn_grain': 'Bu/Acre',
    'corn_silage': 'Tons/Acre',
    'cotton_upland': 'LB/Acre',
    'hay': 'Tons/Acre',
    'rice': 'Bu/Acre',
    'soybeans': 'Bu/Acre',
    'spring_wheat': 'Bu/Acre',
    'winter_wheat': 'Bu/Acre',
}
prices = {
    'alfalfa': 171,
    'corn_grain': 4.53,
    'corn_silage': 61, # cогласно Cornell University
    'cotton_upland': 0.663,
    'hay': 132,
    'rice': 0.6*14.4, #ну 1 bu = 0.6 cwt
    'soybeans': 10.8,
    'spring_wheat': 5.09,
    'winter_wheat': 4.98,
}


for model_type in model_types:
    models[model_type] = {}
    for crop in crop_types:
        models[model_type][crop] = joblib.load(f"./model_weights/{model_type}/{crop}.joblib")

max_recorded_yields = pd.read_csv("./data/max_recorded_yield_2010_2021")

app = Flask(__name__)
CORS(app)
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/process', methods=['POST'])
def process_file():
    try:
        try:
            file = request.files['file']
            model = request.form['model']
            crop = request.form['crop']
            filepath = os.path.join(UPLOAD_FOLDER, file.filename)
            file.save(filepath)
            df = pd.read_csv(filepath)
            field_area = float(request.form.get('field_area'))

        except Exception as e:
            return jsonify({'error': f'Error processing inputs:'}), 500
        
        finally:
            if os.path.exists(filepath):
                os.remove(filepath)

        try:
            result1 = models[model][crop].predict(df)
        except Exception as e:
            return jsonify({'error': f'Error running prediction, Please make sure all of the data is provided correctly'}), 500
        

        try:
            if os.path.exists(filepath):
                os.remove(filepath)
        except Exception as e:
            pass
        
        return jsonify({
            'result1': f'{result1[0]:.3f} {yield_units[crop]}',
            'result2': f'{result1[0] * prices[crop] * field_area :.3f} $',
            'result3': f'{float(max_recorded_yields[crop]):.3f} {yield_units[crop]}',
            'result4': f'{float(max_recorded_yields[crop]) * prices[crop] * field_area :.3f} $'
        })
    except Exception as e:
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=80, debug=False)