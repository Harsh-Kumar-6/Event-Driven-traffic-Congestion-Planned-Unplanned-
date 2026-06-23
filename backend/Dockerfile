FROM python:3.11-slim

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y \
    gcc g++ curl git \
    && rm -rf /var/lib/apt/lists/*

# Install PyTorch CPU (no CUDA needed for inference on Railway)
RUN pip install --no-cache-dir \
    torch==2.3.0 --index-url https://download.pytorch.org/whl/cpu

# Install PyG CPU wheels
RUN pip install --no-cache-dir \
    torch-geometric==2.5.3 \
    torch-scatter torch-sparse \
    -f https://data.pyg.org/whl/torch-2.3.0+cpu.html

# Install remaining deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]