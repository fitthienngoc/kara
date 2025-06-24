declare module "redux-persist-indexeddb-storage" {
  const createStorage: (dbName: 'dev-banhda.vn') => import("redux-persist").Storage;
  export default createStorage;
}
