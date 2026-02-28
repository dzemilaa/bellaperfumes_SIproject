import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

export const productsClient = new ApolloClient({
  link: createHttpLink({
    uri: "https://productservice-production-c2fd.up.railway.app/graphql",
  }),
  cache: new InMemoryCache(),
});

export const orderClient = new ApolloClient({
  link: createHttpLink({
    uri: "https://orderservice-production-4f8d.up.railway.app/graphql",
  }),
  cache: new InMemoryCache(),
});

export const reviewClient = new ApolloClient({
  link: createHttpLink({
    uri: "https://reviewservice-production.up.railway.app/graphql",
  }),
  cache: new InMemoryCache(),
});


export const loginClient = new ApolloClient({
  link: createHttpLink({
    uri: "https://loginservice-production-ab1f.up.railway.app/graphql",
  }),
  cache: new InMemoryCache(),
});
