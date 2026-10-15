export { getPermisos, getRolCargos, getRolPermisos, getRoles } from "./queries";
export {
  createRol,
  replaceRolCargos,
  replaceRolPermisos,
  setRolActive,
  updateRol,
} from "./mutations";
export {
  clearRolesCache,
  getPermisosCatalogCache,
  getRolCargosCache,
  getRolPermisosCache,
  getRolesListCache,
  isRolesDataLoading,
  setRolCargosCache,
  setRolPermisosCache,
  setRolesListCache,
  subscribeRoles,
} from "./cache";
