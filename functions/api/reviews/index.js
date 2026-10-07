export async function onRequestGet({ env }) {
    try {
        const { results } = await env.DB.prepare(`
            SELECT reviews.*, products.title AS product_title 
            FROM reviews 
            LEFT JOIN products ON reviews.product_id = products.id 
            ORDER BY reviews.created_at DESC
        `).all();

        return Response.json(results);
    } catch (err) {
        return Response.json({ error: "Failed to fetch reviews: " + err.message }, { status: 500 });
    }
}

export async function onRequestPost({ request, env }) {
    try {
        const { product_id, customer_name, rating, comment } = await request.json();

        const result = await env.DB.prepare(`
            INSERT INTO reviews (product_id, customer_name, rating, comment) 
            VALUES (?, ?, ?, ?) 
            RETURNING *
        `).bind(product_id, customer_name, rating, comment).first();

        return Response.json(result, { status: 201 });
    } catch (err) {
        return Response.json({ error: "Failed to submit review: " + err.message }, { status: 500 });
    }
}