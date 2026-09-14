from anqor_benchmark import evaluate_binary_classifier


# Replace these with predictions from your own model and a held-out dataset.
y_true = [0, 0, 0, 1, 1, 1]
y_score = [0.08, 0.22, 0.41, 0.62, 0.79, 0.93]

result = evaluate_binary_classifier(y_true, y_score, threshold=0.50)

print("threshold:", result.threshold)
print("confusion matrix:", result.confusion_matrix)
for name, value in result.metrics.items():
    print(f"{name}: {value:.4f}")
