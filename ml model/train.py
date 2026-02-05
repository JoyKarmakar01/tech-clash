import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Embedding, LSTM, Dense, Dropout
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences


# LOAD DATA
df_fake = pd.read_csv("data/Fake.csv")
df_real = pd.read_csv("data/True.csv")

df_fake["label"] = "FAKE"
df_real["label"] = "REAL"

data = pd.concat([df_fake, df_real]).sample(frac=1).dropna()

data["content"] = data["title"] + " " + data["text"]

# LABEL ENCODING
encoder = LabelEncoder()
data["label"] = encoder.fit_transform(data["label"])
# FAKE = 1, REAL = 0

X = data["content"].values
y = data["label"].values

# TOKENIZATION
max_words = 50000
max_len = 300

tokenizer = Tokenizer(num_words=max_words, oov_token="<OOV>")
tokenizer.fit_on_texts(X)

sequences = tokenizer.texts_to_sequences(X)
padded = pad_sequences(sequences, maxlen=max_len, padding="post")

# TRAIN TEST SPLIT
X_train, X_test, y_train, y_test = train_test_split(
    padded, y, test_size=0.2, random_state=42
)

# MODEL (PURE LSTM)
model = Sequential([
    Embedding(max_words, 128, input_length=max_len),
    LSTM(128),
    Dropout(0.3),
    Dense(64, activation="relu"),
    Dropout(0.3),
    Dense(1, activation="sigmoid")
])

model.compile(
    loss="binary_crossentropy",
    optimizer="adam",
    metrics=["accuracy"]
)

model.summary()

# TRAIN
history = model.fit(
    X_train, y_train,
    epochs=5,
    batch_size=64,
    validation_split=0.2
)

# EVALUATION
y_pred = (model.predict(X_test) > 0.5).astype("int32")

print("Accuracy :", accuracy_score(y_test, y_pred))
print("Precision:", precision_score(y_test, y_pred))
print("Recall   :", recall_score(y_test, y_pred))
print("F1-score :", f1_score(y_test, y_pred))

# SAVE MODEL
model.save("fake_news_lstm_model.h5")
print("Model saved ✅")
