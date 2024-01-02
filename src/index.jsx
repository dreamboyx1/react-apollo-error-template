/*** APP ***/
import React, { useState, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { createRoot } from "react-dom/client";
import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  gql,
  useQuery,
  useMutation,
} from "@apollo/client";
import { relayStylePagination } from "@apollo/client/utilities";
import { link } from "./link.js";
import { Subscriptions } from "./subscriptions.jsx";
import { Layout } from "./layout.jsx";
import "./index.css";

const ALL_PEOPLE = gql`
  query AllPeople($last: Int, $before: String) {
    people(last: $last, before: $before) {
      edges {
        cursor
        node {
          id
          name
        }
      }
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

const ADD_PERSON = gql`
  mutation AddPerson($name: String) {
    addPerson(name: $name) {
      id
      name
    }
  }
`;

function App() {
  const [name, setName] = useState("");
  const { loading, data, fetchMore } = useQuery(ALL_PEOPLE);

  const loadMorePeople = useCallback(async () => {
    if (!data || !fetchMore) {
      return;
    }

    try {
      const startCursor = data?.people.pageInfo.startCursor ?? undefined;

      // Let's load more recent ones!
      await fetchMore({
        variables: {
          last: 25,
          before: startCursor,
        },
      });
    } catch (error) {
      console.log(`Error loading events: ${error.message}`);
      // TODO: Let the user know about the error / network issues
    }
  }, [data, fetchMore]);

  return (
    <main>
      <h3>Home</h3>
      <h2>Names</h2>
      {loading ? (
        <p>Loading…</p>
      ) : (
        <ul>
          {data?.people.edges.map(({ node: person }) => (
            <li key={person.id}>{person.name}</li>
          ))}
        </ul>
      )}
      <button onClick={loadMorePeople}>Load more</button>
    </main>
  );
}

const client = new ApolloClient({
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          people: relayStylePagination(),
        },
      },
    },
  }),
  link,
});

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <ApolloProvider client={client}>
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<App />} />
          <Route path="subscriptions-wslink" element={<Subscriptions />} />
        </Route>
      </Routes>
    </Router>
  </ApolloProvider>
);
