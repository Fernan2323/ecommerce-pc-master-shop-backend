/**
 * order controller (ESM version optimizada)
 */

import { factories } from '@strapi/strapi';
import Stripe from 'stripe';

// Configura Stripe con API version estable
const stripe = new Stripe(process.env.STRIPE_KEY as string)

export default factories.createCoreController('api::order.order', ({ strapi }) => ({
  async create(ctx) {
    const { products } = ctx.request.body;
    console.log('📦 Productos recibidos en backend:', products);

    if (!products || !Array.isArray(products)) {
      ctx.response.status = 400;
      return { error: 'Productos inválidos en la petición.' };
    }

    try {
      const lineItems = await Promise.all(
        products.map(async (product) => {
          const productId = Number(product.id);

          if (isNaN(productId)) {
            throw new Error(`ID de producto inválido: ${product.id}`);
          }

          console.log('🔎 Buscando producto con ID:', productId);

          // Buscar producto con entityService y permitir drafts
          const item = await strapi.entityService.findOne('api::product.product', productId, {
            publicationState: 'preview', // Permite drafts y publicados
            fields: ['productName', 'price'], // Solo los campos necesarios
          });

          console.log('📄 Producto encontrado:', item);

          if (!item || !item.productName || !item.price) {
            throw new Error(`Producto con datos incompletos o inexistente: ID ${productId}`);
          }

          return {
            price_data: {
              currency: 'eur',
              product_data: {
                name: item.productName,
              },
              unit_amount: Math.round(item.price * 100), // Convertir a centavos
            },
            quantity: 1,
          };
        })
      );

      // Crear sesión de Stripe
      const session = await stripe.checkout.sessions.create({
        shipping_address_collection: {
          allowed_countries: ['ES'],
        },
        payment_method_types: ['card'],
        mode: 'payment',
        success_url: `${process.env.CLIENT_URL}/success`,
        cancel_url: `${process.env.CLIENT_URL}/successError`,
        line_items: lineItems,
      });
      
      // Guardar la orden en Strapi
      console.log("🛒 Guardando orden con stripeId:", session.id);

      const order = await strapi.service('api::order.order').create({
      data: {
      products,
      stripeid: session.id,
      },
    });

     console.log("✅ Orden guardada:", order);


      return { stripeSession: session };
    } catch (error) {
      console.error('❌ Error en el controlador de orden:', error.message);
      ctx.response.status = 500;
      return { error: error.message };
    }
  },
}));
