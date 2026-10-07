export async function onRequestGet({ env }) {
    try {
        const { results } = await env.DB.prepare(
            "SELECT * FROM products ORDER BY id ASC"
        ).all();

        return Response.json(results);
    } catch (err) {
        return Response.json({ error: 'Server error fetching products: ' + err.message }, { status: 500 });
    }
}

export async function onRequestPost({ request, env }) {
    try {
        const data = await request.json();

        // Format gallery JSON string if media_url is provided as an object/array
        const galleryData = typeof data.media_url === 'object' ? JSON.stringify(data.media_url) : data.media_url;

        await env.DB.prepare(`
            INSERT INTO products (
                title, brand, price, cpu, cpu_cores, gpu, vram, ram, ram_type, 
                storage, storage_type, display_spec, resolution, refresh_rate, 
                panel_type, wifi, ports, webcam, keyboard, security, os, 
                battery_health, weight, material, condition, warranty, category, 
                media_url, description
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            data.title, data.brand, data.price, data.cpu, data.cpu_cores, data.gpu, data.vram,
            data.ram, data.ram_type, data.storage, data.storage_type, data.display_spec,
            data.resolution, data.refresh_rate, data.panel_type, data.wifi, data.ports,
            data.webcam, data.keyboard, data.security, data.os, data.battery_health,
            data.weight, data.material, data.condition, data.warranty, data.category,
            galleryData, data.description
        ).run();

        return Response.json({ message: "Product added successfully" }, { status: 201 });
    } catch (err) {
        return Response.json({ error: 'Server error adding product: ' + err.message }, { status: 500 });
    }
}