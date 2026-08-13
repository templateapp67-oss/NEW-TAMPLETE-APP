import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { savePredefinedServicesWithClient } from '../src/lib/savedServiceService.ts';

const themeId = 'barber_mens_grooming';
const serviceA = '10000000-0000-4000-8000-000000000001';
const serviceB = '10000000-0000-4000-8000-000000000002';

const makeSaved = (predefinedServiceId, suffix) => ({
  id: `20000000-0000-4000-8000-00000000000${suffix}`,
  business_id: '30000000-0000-4000-8000-000000000001',
  theme_id: '40000000-0000-4000-8000-000000000001',
  theme_key: themeId,
  category_id: '50000000-0000-4000-8000-000000000001',
  predefined_service_id: predefinedServiceId,
  name: `Service ${suffix}`,
  category: 'Haircuts',
  description: `Description ${suffix}`,
  price_paise: 125000,
  duration_minutes: 60,
  status: 'active',
  is_featured: false,
});

let passed = 0;
const test = async (name, run) => {
  await run();
  passed += 1;
  console.log(`PASS ${name}`);
};

await test('save request deduplicates IDs and never sends a client tenant ID', async () => {
  const calls = [];
  const client = {
    rpc: async (name, args) => {
      calls.push({ name, args });
      return {
        data: {
          business_id: '30000000-0000-4000-8000-000000000001',
          theme_id: themeId,
          requested_count: 2,
          inserted_count: 2,
          existing_count: 0,
          services: [makeSaved(serviceA, 1), makeSaved(serviceB, 2)],
        },
        error: null,
      };
    },
  };

  const result = await savePredefinedServicesWithClient(
    client,
    themeId,
    [serviceA, serviceA, serviceB],
  );
  assert.deepEqual(calls, [{
    name: 'save_predefined_services',
    args: {
      p_theme_id: themeId,
      p_predefined_service_ids: [serviceA, serviceB],
    },
  }]);
  assert.equal(Object.hasOwn(calls[0].args, 'business_id'), false);
  assert.equal(Object.hasOwn(calls[0].args, 'salon_id'), false);
  assert.equal(result.services.length, 2);
  assert.equal(result.services[0].predefinedServiceId, serviceA);
  assert.equal(result.services[0].price, 1250);
  assert.equal(result.services[0].status, 'active');
});

await test('cross-theme, cross-tenant, and unrequested save responses fail closed', async () => {
  const wrongTheme = makeSaved(serviceA, 1);
  wrongTheme.theme_key = 'hair_studio_color_bar';
  await assert.rejects(
    () => savePredefinedServicesWithClient({
      rpc: async () => ({
        data: {
          business_id: wrongTheme.business_id,
          theme_id: themeId,
          requested_count: 1,
          inserted_count: 1,
          existing_count: 0,
          services: [wrongTheme],
        },
        error: null,
      }),
    }, themeId, [serviceA]),
    /cross-theme/i,
  );

  const wrongTenant = makeSaved(serviceA, 1);
  wrongTenant.business_id = '30000000-0000-4000-8000-000000000099';
  await assert.rejects(
    () => savePredefinedServicesWithClient({
      rpc: async () => ({
        data: {
          business_id: '30000000-0000-4000-8000-000000000001',
          theme_id: themeId,
          requested_count: 1,
          inserted_count: 1,
          existing_count: 0,
          services: [wrongTenant],
        },
        error: null,
      }),
    }, themeId, [serviceA]),
    /different salon/i,
  );

  const unrequested = makeSaved(serviceB, 2);
  await assert.rejects(
    () => savePredefinedServicesWithClient({
      rpc: async () => ({
        data: {
          business_id: unrequested.business_id,
          theme_id: themeId,
          requested_count: 1,
          inserted_count: 1,
          existing_count: 0,
          services: [unrequested],
        },
        error: null,
      }),
    }, themeId, [serviceA]),
    /unrequested/i,
  );
});

await test('Select All and Add Selected use only current visible database suggestions', async () => {
  const source = await readFile('src/screens/StepServices.tsx', 'utf8');
  assert.ok(source.includes('visibleSuggested.map((s) => s.name)'));
  assert.ok(source.includes('activeCatalog.suggestedServices.filter'));
  assert.ok(source.includes('selectedSuggested.includes(service.name)'));
  assert.ok(source.includes('selectedRows.map((service) => service.id)'));
  assert.ok(source.includes('service.predefinedServiceId'));
  assert.ok(source.includes('localPredefinedIds.has(service.predefinedServiceId)'));
  assert.equal((source.match(/savePredefinedServices\(/g) ?? []).length, 1);
});

await test('custom service creation stays explicitly unlinked from predefined rows', async () => {
  const source = await readFile('src/screens/StepServices.tsx', 'utf8');
  const customStart = source.indexOf("id: 'custom-' + Date.now()");
  assert.ok(customStart > -1);
  const customBlock = source.slice(customStart, customStart + 350);
  assert.ok(customBlock.includes('themeId: null'));
  assert.ok(customBlock.includes('categoryId: null'));
  assert.ok(customBlock.includes('predefinedServiceId: null'));
});

console.log(`Service saving tests: ${passed}/4 passed`);
