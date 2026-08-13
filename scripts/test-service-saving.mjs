import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  deleteSavedServiceWithClient,
  loadSavedServicesForThemeWithClient,
  savePredefinedServicesWithClient,
  setSavedServiceActiveWithClient,
  updateSavedServiceWithClient,
} from '../src/lib/savedServiceService.ts';

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

await test('refresh load and management RPCs never accept relationship or tenant rewrites', async () => {
  const calls = [];
  const saved = makeSaved(serviceA, 1);
  const client = {
    rpc: async (name, args) => {
      calls.push({ name, args });
      if (name === 'get_saved_services_for_theme') {
        return {
          data: {
            business_id: saved.business_id,
            theme_id: themeId,
            services: [saved],
          },
          error: null,
        };
      }
      if (name === 'update_saved_service') {
        return {
          data: {
            ...saved,
            name: args.p_name,
            description: args.p_description,
            price_paise: args.p_price_paise,
            duration_minutes: args.p_duration_minutes,
          },
          error: null,
        };
      }
      if (name === 'set_saved_service_active') {
        return { data: { ...saved, status: args.p_is_active ? 'active' : 'inactive' }, error: null };
      }
      if (name === 'delete_saved_service') return { data: saved.id, error: null };
      throw new Error(`Unexpected RPC ${name}`);
    },
  };

  const loaded = await loadSavedServicesForThemeWithClient(client, themeId);
  assert.equal(loaded.length, 1);
  const updated = await updateSavedServiceWithClient(client, themeId, saved.id, {
    name: 'Edited', description: 'Edited description', price: 999, duration: 45,
  });
  assert.equal(updated.name, 'Edited');
  assert.equal(updated.themeId, saved.theme_id);
  assert.equal(updated.categoryId, saved.category_id);
  assert.equal(updated.predefinedServiceId, saved.predefined_service_id);
  const inactive = await setSavedServiceActiveWithClient(client, themeId, saved.id, false);
  assert.equal(inactive.status, 'inactive');
  assert.equal(await deleteSavedServiceWithClient(client, saved.id), saved.id);

  const updateArgs = calls.find((call) => call.name === 'update_saved_service').args;
  for (const forbidden of ['business_id', 'theme_id', 'category_id', 'predefined_service_id']) {
    assert.equal(Object.hasOwn(updateArgs, forbidden), false);
  }
});

await test('theme switching clears snapshots, selections, forms, and stale saved data', async () => {
  const app = await readFile('src/App.tsx', 'utf8');
  const services = await readFile('src/screens/StepServices.tsx', 'utf8');
  assert.equal(app.includes('themeServiceSnapshots'), false);
  assert.ok(app.includes('templateId: nextTheme'));
  assert.ok(app.includes('services: []'));
  assert.ok(app.includes('packages: []'));
  assert.ok(services.includes('setLoadedCatalog(null)'));
  assert.ok(services.includes('setSelectedSuggested([])'));
  assert.ok(services.includes("setSuggestedFilter('All')"));
  assert.ok(services.includes("setNewServiceCategory(firstCategory)"));
  assert.ok(services.includes("setNewServiceName('')"));
  assert.ok(services.includes('services: []'));
  assert.ok(services.includes('loadSavedServicesForTheme(theme)'));
  assert.ok(services.includes('savedLoadRequestRef.current !== requestId'));
});

console.log(`Service saving tests: ${passed}/6 passed`);
