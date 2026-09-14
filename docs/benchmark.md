# Benchmark methodology

Anqor evaluates binary fraud-risk predictions from a fixed set of labels and model scores. The benchmark does not train a model and does not assume a particular ML framework.

## Metrics

At a selected threshold, predictions are converted into positive/negative decisions and the following confusion-matrix metrics are reported:

- precision = TP / (TP + FP)
- recall = TP / (TP + FN)
- specificity = TN / (TN + FP)
- F1 = harmonic mean of precision and recall
- balanced accuracy = mean(recall, specificity)
- MCC = Matthews correlation coefficient

When probability scores are supplied, threshold-independent ranking metrics are also useful. PR-AUC is emphasized for imbalanced fraud problems because it directly reflects the precision/recall trade-off.

## Thresholds are policy choices

A model score is not itself a decision. A threshold should be selected against an explicit operating objective such as investigation capacity or expected cost. Benchmark reports should therefore record the threshold and, when possible, the assumed false-positive and false-negative costs.

## Calibration

A model can rank cases well while producing poorly calibrated probabilities. Calibration statistics are therefore reported separately from discrimination metrics. Calibration quality should be evaluated on data that was not used to fit the model.

## Subgroups

If a dataset contains a legitimate group attribute, subgroup metrics can reveal materially different operating characteristics. Anqor does not prescribe which groups should be evaluated; that decision depends on the application, legal requirements, and data governance context.

## Reproducibility

Record the dataset version/hash, preprocessing version, model version, threshold, random seed where applicable, and benchmark package version alongside results. Never publish sensitive claimant data.
