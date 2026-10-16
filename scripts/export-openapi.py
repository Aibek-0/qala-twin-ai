"""Export the backend contract without server startup or database mutation."""
import json
from pathlib import Path
from backend.app.main import app

target=Path(__file__).resolve().parents[1]/'docs'/'openapi.json'
target.write_text(json.dumps(app.openapi(),ensure_ascii=False,indent=2),encoding='utf-8')
print(f'OpenAPI exported: {len(app.openapi()["paths"])} paths')
