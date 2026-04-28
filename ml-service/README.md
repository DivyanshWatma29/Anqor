# Insurance Fraud Detection System

**Python | Flask | Scikit-Learn**

## 📝 Project Overview

Insurance fraud causes billions of dollars in losses every year. Detecting fraudulent claims early can significantly reduce financial risk for insurance companies.

This project implements an **end-to-end Machine Learning pipeline** to detect fraudulent insurance claims. Using historical claim data and policy information, the system predicts whether a new claim is **legitimate or potentially fraudulent**.

The trained model is integrated into a **Flask web application**, allowing users to input claim details and receive real-time fraud predictions.

---

## 🚀 Project Workflow

The project is structured into the following stages:

**1. Problem Understanding**
Define the business problem and identify the impact of fraudulent claims.

**2. Data Preparation**
Handle missing values, clean the dataset, and treat outliers using **IQR capping**.

**3. Exploratory Data Analysis (EDA)**
Analyze feature distributions and correlations using visualizations.

**4. Model Building**
Train multiple classification models:

* K-Nearest Neighbors (KNN)
* Decision Tree
* Random Forest
* Logistic Regression
* Naïve Bayes
* Support Vector Machine (SVM)

**5. Performance Evaluation**
Compare models using:

* Accuracy
* Confusion Matrix
* Cross-validation scores

**6. Model Deployment**
Save the best-performing model (**SVM**) using **Joblib** and deploy it using a **Flask web application**.

**7. Documentation**
Document the methodology, results, and implementation.

---

## 🛠️ Tech Stack

**Language**

* Python

**Libraries**

* Pandas
* NumPy
* Scikit-learn
* Matplotlib
* Seaborn
* Missingno

**Web Framework**

* Flask (with HTML/CSS frontend)

**Model Serialization**

* Joblib

---

## 📊 Model Performance

| Model                | Mean Accuracy |
| -------------------- | ------------- |
| **SVM (Best Model)** | **80.93%**    |
| Logistic Regression  | 80.40%        |
| Random Forest        | 77.47%        |
| KNN                  | 72.53%        |
| Decision Tree        | 70.67%        |
| Naïve Bayes          | 53.20%        |

The **Support Vector Machine (SVM)** achieved the best performance and was selected for deployment.

---

## 💻 Installation & Usage

### Prerequisites

* Python 3.x
* pip

---

## 📂 Project Structure

```
insurance-fraud-detection
│
├── app.py
├── data
│   └── insurance_claims.csv
│
├── models
│   ├── best_model.joblib
│   ├── scaler.joblib
│   └── model_columns.joblib
│
├── notebooks
│   └── Insurance_Fraud_Detection.ipynb
│
├── templates
│   └── index.html
│
├── requirements.txt
└── README.md
```

---

## 📌 Future Improvements

* Deploy the application on **Docker / cloud platforms**
* Add **model explainability (SHAP or LIME)**
* Implement **API endpoints for external integration**
* Improve UI with **React or Bootstrap**

---

## 👤 Author

Divyansh
