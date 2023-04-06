import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();

export default NextAuth({
	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
		}),
	],
	adapter: PrismaAdapter(prisma),
	events: {
		createUser: async ({ user }) => {
			// create a stripe instance
			const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
				apiVersion: '2022-11-15',
			});

			if (user.name && user.email) {
				// create stripe customer
				const customer = await stripe.customers.create({
					email: user.email,
					name: user.name,
				});

				// update user with stripe customer id
				await prisma.user.update({
					where: {
						id: user.id,
					},
					data: {
						stripeCustomerId: customer.id,
					},
				});
			}
		},
	},
	secret: process.env.NEXTAUTH_SECRET as string,
});
