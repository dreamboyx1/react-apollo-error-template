/*** APP ***/
import React, { useState, useCallback, useReducer } from "react";
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
import { relayStylePagination } from "./pagination.ts";
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
  const { loading, data, fetchMore } = useQuery(ALL_PEOPLE, {
    notifyOnNetworkStatusChange: true,
  });
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  console.log(`data: ${JSON.stringify(data)}`);
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

  const [addPerson] = useMutation(ADD_PERSON, {
    update: (cache, { data: { addPerson: addPersonData } }) => {
      cache.modify({
        fields: {
          people(existing, { storeFieldName, fieldName, toReference }) {
            const personRef = toReference(addPersonData);

            if (!personRef) {
              return existing;
            }

            console.log(`existing: ${JSON.stringify(existing, undefined, 2)}`);
            if (!existing) {
              existing = {
                edges: [],
                pageInfo: {
                  hasPreviousPage: false,
                  hasNextPage: false,
                  startCursor: null,
                  endCursor: null,
                  __typename: "PageInfo",
                },
                __typename: "PersonConnection",
              };
            }

            const edge = {
              __typename: "PersonEdge",
              cursor: "",
              node: personRef,
            };

            const updated = {
              ...existing,
              edges: [...existing.edges, edge],
            };

            return updated;
          },
        },
      });
    },
  });

  const handleAddPerson = useCallback(async () => {
    console.log(`name "${name}"`);

    const trimmed = name.trim();

    if (!trimmed) {
      return;
    }
    const res = await addPerson({ variables: { name: trimmed } });
    console.log(`res: ${JSON.stringify(res, undefined, 2)}`);
    setName("");
  }, [addPerson, setName, name]);

  return (
    <main>
      <h3>Home</h3>
      <div className="add-person">
        <label htmlFor="name">Name</label>
        <input
          type="text"
          name="name"
          value={name}
          onChange={(evt) => setName(evt.target.value)}
        />
        <button onClick={handleAddPerson}>Add person</button>
      </div>
      <h3>PageInfo</h3>
      <pre>{JSON.stringify(data?.people.pageInfo, undefined, 2)}</pre>
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
      <button onClick={loadMorePeople}>Fetch more</button>
      <button onClick={forceUpdate}>Re-render</button>
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
