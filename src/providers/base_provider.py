from abc import ABC, abstractmethod
import asyncio
import json

class DataProviderBase(ABC):
    def __init__(self, config_path='src/config.json'):
        with open(config_path, 'r') as f:
            self.config = json.load(f)
        self.port = self.config['udp']['port']
        self.host = self.config['udp']['host']
        self.transport = None

    @abstractmethod
    async def generate_data(self):
        pass

    async def start(self):
        loop = asyncio.get_event_loop()
        self.transport, _ = await loop.create_datagram_endpoint(
            lambda: self,
            remote_addr=(self.host, self.port)
        )
        while True:
            data = await self.generate_data()
            self.transport.sendto(json.dumps(data).encode())
            await asyncio.sleep(1/self.config['update_rate'])
            