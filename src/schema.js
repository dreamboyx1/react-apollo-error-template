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
  edges: [
    { cursor: 1, node: { id: 1, name: "John Smith" } },
    { cursor: 2, node: { id: 2, name: "Sara Smith" } },
    { cursor: 3, node: { id: 3, name: "Budd Deey" } },
  ],
  pageInfo: {
    startCursor: 1,
    endCursor: 3,
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

export const schema = new GraphQLSchema({
  query: QueryType,
});
