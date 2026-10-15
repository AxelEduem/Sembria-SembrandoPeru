import { expect, test } from "@playwright/test";

const profile = {
  id: "account-1",
  user_id: 1,
  persona_id: "person-1",
  nombres: "Axel",
  apellidos: "Administrador",
  correo: "admin@sembria.test",
  activo: true,
  avatar_path: "avatars/admin.png",
  tipo_integrante: "voluntario",
  persona: {
    id: "person-1",
    nombres: "Axel",
    apellidos: "Administrador",
    correo: "admin@sembria.test",
  },
  integrante: { id: 1, estado: "Activo", avatar_path: "avatars/admin.png" },
  historial: { id: 1, estado: "Activo", tipo_integrante: "voluntario" },
  periodo: { id: 1, estado: "Activo", tipo_integrante: "voluntario" },
  area_id: 1,
  area: { id: 1, nombre: "Tecnología", activo: true },
  cargo: { id: 1, nombre: "Administrador", activo: true, area_id: 1 },
  role: { id: 1, codigo: "admin", nombre: "Administrador", activo: true, acceso_total: true },
  permissions: [],
};

const user = { id: 1, name: "Axel Administrador", email: "admin@sembria.test" };

function json(route, body, status = 200) {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function mockBackend(page, { authenticated = true } = {}) {
  let hasSession = authenticated;

  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const { pathname } = url;

    if (pathname === "/sanctum/csrf-cookie") {
      return json(route, { success: true });
    }

    if (pathname === "/api/login" && request.method() === "POST") {
      hasSession = true;
      return json(route, { success: true, user, profile });
    }

    if (pathname === "/api/me") {
      return hasSession
        ? json(route, { success: true, user, profile })
        : json(route, { message: "Unauthenticated." }, 401);
    }

    if (pathname === "/api/inicio") {
      return json(route, { success: true, data: {} });
    }

    if (pathname === "/api/integrantes/catalogs") {
      return json(route, {
        success: true,
        data: {
          areas: [{ id: 1, nombre: "Tecnología", activo: true }],
          cargos: [{ id: 1, nombre: "Administrador", area_id: 1, activo: true }],
        },
      });
    }

    if (pathname === "/api/integrantes/7") {
      return json(route, {
        success: true,
        data: {
          id: 7,
          historial_id: 70,
          tipo_integrante: "voluntario",
          nombres: "Ana",
          apellidos: "Pérez",
          fecha_nacimiento: "1998-01-15",
          cargo_id: 1,
          cargo_area_id: 1,
          fecha_inicio: "2026-01-01",
          fecha_fin: "2026-12-31",
        },
      });
    }

    if (pathname === "/api/integrantes" && request.method() === "GET") {
      return json(route, {
        success: true,
        data: [
          {
            id: 7,
            historial_id: 70,
            persona_id: "person-7",
            nombre: "Ana Pérez",
            correo: "ana@sembria.test",
            tipo_integrante: "voluntario",
            area: "Tecnología",
            area_id: 1,
            cargo: "Voluntaria",
            cargo_id: 1,
            estado: "Activo",
          },
        ],
      });
    }

    if (pathname === "/api/aplicaciones") {
      return json(route, {
        success: true,
        data: [
          {
            id: 3,
            nombre: "Google Workspace",
            activo: true,
            area_id: 1,
            licencias_total: 10,
            licencias_usadas: 0,
          },
        ],
      });
    }

    if (pathname === "/api/integrante-access-assignments") {
      return json(route, { success: true, data: [] });
    }

    if (pathname === "/api/mi-asistencia") {
      return json(route, { success: true, data: [] });
    }

    if (pathname === "/api/gestion-proyectos/fuentes-financiamiento") {
      return json(route, { success: true, data: [] });
    }

    if (pathname === "/api/gestion-proyectos/convocatorias/5/primer-filtro") {
      return json(route, {
        success: true,
        data: {
          id: 5,
          nombre: "Fondo de innovación",
          financiador_nombre: "Entidad cooperante",
          fuente: { nombre: "Portal institucional" },
          primer_filtro_autorizado: true,
          evaluaciones: [],
        },
      });
    }

    if (pathname.startsWith("/api/")) {
      return json(route, { success: true, data: [] });
    }

    return route.continue();
  });
}

test("inicio de sesión redirige al panel autenticado", async ({ page }) => {
  await mockBackend(page, { authenticated: false });
  await page.goto("/");

  await page.getByLabel("Correo electrónico").fill("admin@sembria.test");
  await page.locator("#password").fill("Secret123!");
  await page.getByRole("button", { name: /iniciar sesión/i }).click();

  await expect(page).toHaveURL(/\/inicio$/);
});

test("registro y edición de integrante cargan sus formularios protegidos", async ({ page }) => {
  await mockBackend(page);

  await page.goto("/integrantes/nuevo");
  await expect(page.getByRole("heading", { name: "Registrar nuevo integrante" })).toBeVisible();

  await page.goto("/integrantes/7/editar");
  await expect(page.getByRole("heading", { name: "Editar integrante" })).toBeVisible();
});

test("marcación y solicitud de permiso permanecen disponibles", async ({ page }) => {
  await mockBackend(page);

  await page.goto("/asistencia");
  await expect(page.getByText("Mi jornada")).toBeVisible();
  await expect(page.getByText("No tienes bloques programados hoy.")).toBeVisible();

  await page.goto("/asistencia/solicitudes/nueva");
  await expect(page.getByRole("main").getByRole("heading", { name: "Solicitar permiso" })).toBeVisible();
});

test("creación y evaluación de convocatoria cargan el flujo Laravel", async ({ page }) => {
  await mockBackend(page);

  await page.goto("/gestion-proyectos/detecta/convocatorias/nueva");
  await expect(page.getByRole("heading", { name: "Nueva convocatoria" })).toBeVisible();

  await page.goto("/gestion-proyectos/detecta/convocatorias/5/evaluacion");
  await expect(page.getByRole("heading", { name: "Primer filtro de convocatoria" })).toBeVisible();
});

test("asignación de accesos abre la gestión del integrante", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/accesos");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Descargar Excel" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("integrantes_y_accesos.xlsx");
  expect(await download.failure()).toBeNull();

  await page.getByRole("button", { name: "Gestionar" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Gestionar accesos" })).toBeVisible();
  await expect(dialog.getByText("Google Workspace")).toBeVisible();
});
