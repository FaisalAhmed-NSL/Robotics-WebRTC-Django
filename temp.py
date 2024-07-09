import redis
from pathlib import Path
import os
from dotenv import load_dotenv


env_path = Path('.') / 'env' / '.env'
load_dotenv(dotenv_path=env_path)
REDIS_URL = os.environ.get('REDIS_URL')
print('REDIS_URL:', REDIS_URL)
r = redis.Redis.from_url(REDIS_URL)

try:
    r.ping()
    print("Connected to Redis successfully!")
except redis.ConnectionError as e:
    print(f"Connection to Redis failed: {e}")
