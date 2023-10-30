const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const DOMAIN = process.env.DOMAIN;


exports.stripeWebhook = async (req, res) => {};


exports.createCheckoutSession = async (req, res) => {
    try {
        console.log('Lookup key: ', req.body.lookup_key) //!REMOVE
        const unxid = req.query.unxid
        const prices = await stripe.prices.list({
            lookup_keys: [req.body.lookup_key],
            expand: ['data.product'],
          });

          console.log('prices: ', prices) //!REMOVE

          const session = await stripe.checkout.sessions.create({
            billing_address_collection: 'auto',
            line_items: [
              {
                price: prices.data[0].id,
                quantity: 1,
        
              },
            ],
            mode: 'subscription',
            allow_promotion_codes: true,
            success_url: `${DOMAIN}?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${DOMAIN}?canceled=true`,
            automatic_tax: { enabled: true },
            metadata: {unxid}
          });
        
          res.redirect(303, session.url);


    } catch (error) {
        console.log('Error creating checkout session: ', error) //TODO: Handle this error
        res.status(500).json({message: 'Error creating checkout session', data: error})
    }
}