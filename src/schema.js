/*** SCHEMA ***/
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLID,
  GraphQLString,
  GraphQLList,
  GraphQLBoolean,
  GraphQLInt,
} from "graphql";

const PageInfoType = new GraphQLObjectType({
  name: "PageInfo",
  fields: {
    startCursor: { type: GraphQLString },
    endCursor: { type: GraphQLString },
    hasNextPage: { type: GraphQLBoolean },
    hasPreviousPage: { type: GraphQLBoolean },
  },
});

const PersonType = new GraphQLObjectType({
  name: "Person",
  fields: {
    id: { type: GraphQLID },
    name: { type: GraphQLString },
  },
});

const PersonEdgeType = new GraphQLObjectType({
  name: "PersonEdge",
  fields: {
    cursor: { type: GraphQLString },
    node: { type: PersonType },
  },
});

const PersonConnectionType = new GraphQLObjectType({
  name: "PersonConnection",
  fields: {
    edges: { type: new GraphQLList(PersonEdgeType) },
    pageInfo: { type: PageInfoType },
  },
});

const peopleData = {
  edges: [{ cursor: "0", node: { id: 0, name: "John Smith" } }],
  pageInfo: {
    startCursor: "0",
    endCursor: "0",
    hasNextPage: false,
    hasPreviousPage: false,
  },
};

const emptyPeopleData = {
  edges: [],
  pageInfo: {
    startCursor: null,
    endCursor: null,
    hasNextPage: false,
    hasPreviousPage: false,
  },
};

const QueryType = new GraphQLObjectType({
  name: "Query",
  fields: {
    people: {
      type: PersonConnectionType,
      args: {
        last: { type: GraphQLInt },
        before: { type: GraphQLString },
      },
      resolve: (_source, args) => {
        console.log(`args: ${JSON.stringify(args)}`);
        if (args.before) {
          return emptyPeopleData;
        }
        return peopleData;
      },
    },
  },
});

const MutationType = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    addPerson: {
      type: PersonType,
      args: {
        name: { type: GraphQLString },
      },
      resolve: function (_, { name }) {
        const person = {
          id: peopleData.edges.length
            ? peopleData.edges[peopleData.edges.length - 1].node.id + 1
            : 0,
          name,
        };

        const edge = {
          cursor: `${person.id}`,
          node: person,
        };

        peopleData.edges = [...peopleData.edges, edge];
        peopleData.pageInfo.endCursor = edge.cursor;
        return person;
      },
    },
  },
});

export const schema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
});
