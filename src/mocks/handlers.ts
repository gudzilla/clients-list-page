import { http, HttpResponse, delay } from 'msw';
import { clients, regions, generateId } from './data';
import type { Client, CreateClientDto, UpdateClientDto } from '../features/clients/types';

export const handlers = [
  // GET /api/clients - список с фильтрами и пагинацией
  http.get('/api/clients', async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const query = url.searchParams.get('query')?.toLowerCase();
    const parentClientId = url.searchParams.get('parentClientId');
    const regionId = url.searchParams.get('regionId');
    const partyType = url.searchParams.get('partyType');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';

    let filtered = [...clients];

    // Фильтр по поиску
    if (query) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.fullName?.toLowerCase().includes(query)
      );
    }

    // Фильтр по родителю
    if (parentClientId) {
      filtered = filtered.filter((c) => c.parentClientId === parentClientId);
    }

    // Фильтр по региону
    if (regionId) {
      filtered = filtered.filter((c) => c.regionId === regionId);
    }

    // Фильтр по типу
    if (partyType) {
      filtered = filtered.filter((c) => c.partyType === partyType);
    }

    // Сортировка
    filtered.sort((a, b) => {
      const aVal = a[sortBy as keyof Client];
      const bVal = b[sortBy as keyof Client];

      if (aVal === null) return 1;
      if (bVal === null) return -1;

      const comparison = String(aVal).localeCompare(String(bVal));
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    const total = filtered.length;
    const data = filtered.slice(offset, offset + limit);

    return HttpResponse.json({
      data,
      total,
      limit,
      offset,
    });
  }),

  // GET /api/clients/select-options - для селекта родителя
  http.get('/api/clients/select-options', async () => {
    await delay(200);

    const options = clients.map((c) => ({
      id: c.id,
      name: c.name,
    }));

    return HttpResponse.json(options);
  }),

  // GET /api/clients/:id - один клиент
  http.get('/api/clients/:id', async ({ params }) => {
    await delay(200);

    const client = clients.find((c) => c.id === params.id);

    if (!client) {
      return HttpResponse.json(
        { message: 'Клиент не найден' },
        { status: 404 }
      );
    }

    return HttpResponse.json(client);
  }),

  // POST /api/clients - создать
  http.post('/api/clients', async ({ request }) => {
    await delay(300);

    const body = (await request.json()) as CreateClientDto;

    const newClient: Client = {
      id: generateId(),
      name: body.name,
      fullName: body.fullName || null,
      partyType: body.partyType,
      inn: body.inn || null,
      parentClientId: body.parentClientId || null,
      regionId: body.regionId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    clients.push(newClient);

    return HttpResponse.json(newClient, { status: 201 });
  }),

  // PUT /api/clients/:id - обновить
  http.put('/api/clients/:id', async ({ params, request }) => {
    await delay(300);

    const index = clients.findIndex((c) => c.id === params.id);

    if (index === -1) {
      return HttpResponse.json(
        { message: 'Клиент не найден' },
        { status: 404 }
      );
    }

    const body = (await request.json()) as UpdateClientDto;

    clients[index] = {
      ...clients[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json(clients[index]);
  }),

  // DELETE /api/clients/:id - удалить
  http.delete('/api/clients/:id', async ({ params }) => {
    await delay(300);

    const index = clients.findIndex((c) => c.id === params.id);

    if (index === -1) {
      return HttpResponse.json(
        { message: 'Клиент не найден' },
        { status: 404 }
      );
    }

    clients.splice(index, 1);

    return HttpResponse.json({ success: true });
  }),

  // GET /api/regions - справочник регионов
  http.get('/api/regions', async () => {
    await delay(200);
    return HttpResponse.json(regions);
  }),
];
