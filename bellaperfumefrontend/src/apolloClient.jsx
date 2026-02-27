import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import fetch from "cross-fetch";

const authClient = new ApolloClient({
  link: createHttpLink({
    uri: "https://loginservice-production-ab1f.up.railway.app/graphql",
     credentials: "include",
    fetch,
  }),
  cache: new InMemoryCache(),
});

const productsClient = new ApolloClient({
  link: createHttpLink({
    uri: "https://productservice-production-c2fd.up.railway.app/graphql",
  }),
  cache: new InMemoryCache(),
});

const shopClient = new ApolloClient({
  link: createHttpLink({
    uri: "https://shopservice-production.up.railway.app/graphql",
  }),
  cache: new InMemoryCache(),
});

const orderClient = new ApolloClient({
  link: createHttpLink({
    uri: "https://orderservice-production-4f8d.up.railway.app/graphql",
      credentials: "include",
    fetch,
    
  }),
  cache: new InMemoryCache(),
});

const reviewClient = new ApolloClient({
  link: createHttpLink({
    uri: "https://reviewservice-production.up.railway.app/graphql"
  }),
  cache: new InMemoryCache(),
});
export { authClient, productsClient, shopClient, orderClient, reviewClient };
