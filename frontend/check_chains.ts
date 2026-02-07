import { createConfig, getChains } from '@lifi/sdk';

createConfig({
    integrator: 'yellow-invoice',
});

async function main() {
    try {
        const chains = await getChains();
        console.log('Supported Chains:', chains.map(c => ({ id: c.id, name: c.name })));
    } catch (e) {
        console.error('Error fetching chains:', e);
    }
}

main();
