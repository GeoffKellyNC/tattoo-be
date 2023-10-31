const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');

const DOMAIN = process.env.DOMAIN;



exports.stripeWebhook = async (req, res) => {
    try {
        let event = req.body

        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if(endpointSecret){
            const signiture = req.headers['stripe-signature']

            try {
                event = stripe.webhooks.constructEvent(
                    req.body,
                    signiture,
                    endpointSecret
                )
            } catch (error) {
                console.log(`⚠️Webhook signature verification failed.`, error.message);
                return response.sendStatus(400);
            }
        }

        let subscription; 
        let status;

        console.log("EVENT RECEIVED: ", event.type) //!REMOVE

        switch(event.type){
            case 'checkout.session.completed':
                const session = event.data.object;
                const metadata = session.metadata;
                const unxid = metadata.unxid;
                const customerId = session.customer;
                await User.setStripeCustomerID(unxid, customerId)
                console.log('unxid: ', unxid) //!REMOVE
                console.log('session: ', session) //!REMOVE
                console.log('metadata: ', metadata) //!REMOVE
                console.log('customerId: ', customerId) //!REMOVE
                break;

            case 'customer.subscription.deleted':
                subscription = event.data.object;
                status = subscription.status;
                await User.updateUserSubscription(subscription.customer, 'monthly', false)
                break;

            case 'customer.subscription.created':
                console.log('subscription created') //!REMOVE
                subscription = event.data.object;
                status = subscription.status;
                console.log(`Subscription status is ${status}.`); //!REMOVE
                await User.updateUserSubscription(subscription.customer, 'monthly', true)
                break;

            case 'customer.subscription.updated':
                console.log('subscription updated') //!REMOVE
                subscription = event.data.object;
                status = subscription.status;
                if(status !== 'active'){
                    await User.updateUserSubscription(subscription.customer, 'monthly', false)
                    break;
                }
                await User.updateUserSubscription(subscription.customer, 'monthly', true)
                break;

            case 'customer.subscription.paused':
                console.log('subscription paused') //!REMOVE
                console.log('subscription: ', subscription) //!REMOVE
                subscription = event.data.object;
                status = subscription.status;
                await User.updateUserSubscription(subscription.customer, 'monthly', false)
                break;

            case 'customer.subscription.resumed':
                console.log('subscription resumed') //!REMOVE
                subscription = event.data.object;
                status = subscription.status;
                await User.updateUserSubscription(subscription.customer, 'monthly', true)
                break;
            default:
                console.log(`Unhandled event type ${event.type}.`);
        }

        res.status(200).json({message: 'Success'})

    } catch (error) {
        console.log('Error In webhook: ', error)
        res.status(500).json({message: 'Error Webook', data: error})
    }

};


exports.createCheckoutSession = async (req, res) => {
    try {
        const unxid = req.query.unxid
        const prices = await stripe.prices.list({
            lookup_keys: [req.body.lookup_key],
            expand: ['data.product'],
          });

          console.log('lookup key: ', req.body.lookup_key) //!REMOVE
          console.log('prices: ', prices) //!REMOVE
          console.log('unxid: ', unxid) //!REMOVE

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

        await User.setStripeSessionId(unxid, session.id)
        
        res.status(200).json({message: 'Success', data: session.url})


    } catch (error) {
        console.log('Error creating checkout session: ', error) //TODO: Handle this error
        res.status(500).json({message: 'Error creating checkout session', data: error})
    }
}


exports.setStripeSessionId = async (req, res) => {
    try {
        const unxid = req.headers['user_unx_id']
        const sessionId = req.body.session_id

        await User.setStripeSessionId(unxid, sessionId)

        res.status(200).json({message: 'Success'})
    } catch (error) {
        console.log('Error setting stripe session id: ', error) //TODO: Handle this error
        res.status(500).json({message: 'Error setting stripe session id', data: error})
    }
}

exports.createPortalSession = async (req, res) => {
    try {
        const unxid = req.headers['user_unx_id']

        const session_id = await User.getStripeSessionId(unxid)

        const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);
      
        const returnUrl = DOMAIN;
      
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: checkoutSession.customer,
          return_url: returnUrl,
        });
      
        res.redirect(303, portalSession.url);
    } catch (error) {
        res.status(500).json({message: 'Error creating portal session', data: error})
    }
  };