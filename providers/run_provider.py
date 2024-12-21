import asyncio
import argparse
from providers.simulation_provider import SimulationProvider
from providers.test_provider import TestProvider

async def main(provider_type):
    if provider_type == 'simulation':
        provider = SimulationProvider()
    else:
        provider = TestProvider()
    
    await provider.start()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--provider', choices=['simulation', 'test'], default='simulation')
    args = parser.parse_args()
    
    asyncio.run(main(args.provider))
