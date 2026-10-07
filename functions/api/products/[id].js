export async function onRequestGet({ env, params }) {
    try {
        const id = params.id;
        const product = await env.DB.prepare("SELECT * FROM products WHERE id = ?").bind(id).first();

        if (!product) {
            return Response.json({ error: "Product not found" }, { status: 404 });
        }

        return Response.json(product);
    } catch (err) {
        return Response.json({ error: "Server error fetching product: " + err.message }, { status: 500 });
    }
}

export async function onRequestPut({ request, env, params }) {
    try {
        const id = params.id;
        const data = await request.json();

        const galleryData = data.media_url !== undefined
            ? (typeof data.media_url === 'object' ? JSON.stringify(data.media_url) : data.media_url)
            : undefined;

        const fieldsMapping = {
            title: data.title,
            brand: data.brand,
            price: data.price,
            cpu: data.cpu,
            cpu_cores: data.cpu_cores,
            gpu: data.gpu,
            vram: data.vram,
            ram: data.ram,
            ram_type: data.ram_type,
            storage: data.storage,
            storage_type: data.storage_type,
            display_spec: data.display_spec,
            resolution: data.resolution,
            refresh_rate: data.refresh_rate,
            panel_type: data.panel_type,
            wifi: data.wifi,
            ports: data.ports,
            webcam: data.webcam,
            keyboard: data.keyboard,
            security: data.security,
            os: data.os,
            battery_health: data.battery_health,
            weight: data.weight,
            material: data.material,
            condition: data.condition,
            warranty: data.warranty,
            category: data.category,
            media_url: galleryData,
            description: data.description
        };

        const updates = [];
        const values = [];

        // Build SQL dynamically for provided fields
        for (const [key, value] of Object.entries(fieldsMapping)) {
            if (value !== undefined) {
                updates.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (updates.length === 0) {
            return Response.json({ message: "No fields provided to update" });
        }

        values.push(id);
        const query = `UPDATE products SET ${updates.join(', ')} WHERE id = ?`;

        await env.DB.prepare(query).bind(...values).run();

        return Response.json({ message: "Product updated successfully" });
    } catch (err) {
        return Response.json({ error: 'Server error updating product: ' + err.message }, { status: 500 });
    }
}

export async function onRequestDelete({ env, params }) {
    try {
        const id = params.id;

        await env.DB.prepare("DELETE FROM products WHERE id = ?").bind(id).run();

        return Response.json({ message: "Product deleted successfully" });
    } catch (err) {
        return Response.json({ error: 'Server error deleting product: ' + err.message }, { status: 500 });
    }
}