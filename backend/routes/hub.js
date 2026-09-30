const express = require("express");
const router = express.Router();

const db = require("../db");
const authenticateToken = require("../middleware/auth");

/*
 * AP-STREAM Hub
 * Core project, source file and version API.
 *
 * Authentication:
 *   Existing AP-STREAM JWT
 *
 * Ownership:
 *   Projects belong to an AP-STREAM user.
 */

// ----------------------------------------------------
// Helpers
// ----------------------------------------------------

function getUserId(req) {
  const userId = Number(req.user?.userId);
  return Number.isInteger(userId) && userId > 0 ? userId : null;
}

function cleanProjectName(value) {
  return String(value || "").trim();
}

function makeSlug(value) {
  return cleanProjectName(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

async function projectOwnedByUser(projectId, userId) {
  const result = await db.query(
    `SELECT id
       FROM ap_hub_projects
      WHERE id = $1
        AND owner_id = $2`,
    [projectId, userId]
  );

  return result.rows.length > 0;
}

// ----------------------------------------------------
// PROJECTS
// ----------------------------------------------------

router.post("/projects", authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Invalid authenticated user"
      });
    }

    const name = cleanProjectName(req.body?.name);
    const description = String(req.body?.description || "").trim();
    const visibility =
      req.body?.visibility === "public" ? "public" : "private";

    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Project name is required"
      });
    }

    if (name.length > 100) {
      return res.status(400).json({
        success: false,
        error: "Project name must be 100 characters or less"
      });
    }

    const baseSlug = makeSlug(name);

    if (!baseSlug) {
      return res.status(400).json({
        success: false,
        error: "Project name must contain letters or numbers"
      });
    }

    let slug = baseSlug;
    let suffix = 1;

    while (true) {
      const existing = await db.query(
        `SELECT id
           FROM ap_hub_projects
          WHERE owner_id = $1
            AND slug = $2
          LIMIT 1`,
        [userId, slug]
      );

      if (!existing.rows.length) break;

      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    const result = await db.query(
      `INSERT INTO ap_hub_projects
        (owner_id, name, slug, description, visibility)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING
        id,
        owner_id,
        name,
        slug,
        description,
        visibility,
        default_branch,
        created_at,
        updated_at`,
      [userId, name, slug, description, visibility]
    );

    const project = result.rows[0];

    await db.query(
      `INSERT INTO ap_hub_project_members
        (project_id, user_id, role)
       VALUES ($1, $2, 'owner')
       ON CONFLICT (project_id, user_id) DO NOTHING`,
      [project.id, userId]
    );

    return res.status(201).json({
      success: true,
      project
    });
  } catch (error) {
    console.error("AP-STREAM Hub create project error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to create project"
    });
  }
});


router.get("/projects", authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Invalid authenticated user"
      });
    }

    const result = await db.query(
      `SELECT DISTINCT
          p.id,
          p.owner_id,
          p.name,
          p.slug,
          p.description,
          p.visibility,
          p.default_branch,
          p.created_at,
          p.updated_at,
          m.role
       FROM ap_hub_projects p
       LEFT JOIN ap_hub_project_members m
         ON m.project_id = p.id
        AND m.user_id = $1
       WHERE p.owner_id = $1
          OR m.user_id = $1
       ORDER BY p.updated_at DESC, p.id DESC`,
      [userId]
    );

    return res.json({
      success: true,
      projects: result.rows
    });
  } catch (error) {
    console.error("AP-STREAM Hub list projects error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to load projects"
    });
  }
});


router.get("/projects/:projectId", authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    const projectId = Number(req.params.projectId);

    if (!userId || !Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid project"
      });
    }

    const result = await db.query(
      `SELECT DISTINCT
          p.id,
          p.owner_id,
          p.name,
          p.slug,
          p.description,
          p.visibility,
          p.default_branch,
          p.created_at,
          p.updated_at,
          m.role
       FROM ap_hub_projects p
       LEFT JOIN ap_hub_project_members m
         ON m.project_id = p.id
        AND m.user_id = $2
       WHERE p.id = $1
         AND (p.owner_id = $2 OR m.user_id = $2)`,
      [projectId, userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        error: "Project not found"
      });
    }

    return res.json({
      success: true,
      project: result.rows[0]
    });
  } catch (error) {
    console.error("AP-STREAM Hub get project error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to load project"
    });
  }
});


router.patch("/projects/:projectId", authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    const projectId = Number(req.params.projectId);

    if (!userId || !Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid project"
      });
    }

    if (!(await projectOwnedByUser(projectId, userId))) {
      return res.status(404).json({
        success: false,
        error: "Project not found"
      });
    }

    const name =
      req.body?.name !== undefined
        ? cleanProjectName(req.body.name)
        : null;

    const description =
      req.body?.description !== undefined
        ? String(req.body.description).trim()
        : null;

    const visibility =
      req.body?.visibility !== undefined
        ? String(req.body.visibility)
        : null;

    if (name !== null && !name) {
      return res.status(400).json({
        success: false,
        error: "Project name cannot be empty"
      });
    }

    if (
      visibility !== null &&
      !["private", "public"].includes(visibility)
    ) {
      return res.status(400).json({
        success: false,
        error: "Visibility must be private or public"
      });
    }

    const result = await db.query(
      `UPDATE ap_hub_projects
          SET name = COALESCE($1, name),
              description = COALESCE($2, description),
              visibility = COALESCE($3, visibility),
              updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
          AND owner_id = $5
       RETURNING
          id,
          owner_id,
          name,
          slug,
          description,
          visibility,
          default_branch,
          created_at,
          updated_at`,
      [name, description, visibility, projectId, userId]
    );

    return res.json({
      success: true,
      project: result.rows[0]
    });
  } catch (error) {
    console.error("AP-STREAM Hub update project error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to update project"
    });
  }
});


// ----------------------------------------------------
// FILES
// ----------------------------------------------------

router.get(
  "/projects/:projectId/files",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = getUserId(req);
      const projectId = Number(req.params.projectId);

      if (
        !userId ||
        !Number.isInteger(projectId) ||
        projectId <= 0
      ) {
        return res.status(400).json({
          success: false,
          error: "Invalid project"
        });
      }

      if (!(await projectOwnedByUser(projectId, userId))) {
        return res.status(404).json({
          success: false,
          error: "Project not found"
        });
      }

      const result = await db.query(
        `SELECT
            id,
            project_id,
            path,
            content,
            created_by,
            updated_by,
            created_at,
            updated_at
         FROM ap_hub_files
        WHERE project_id = $1
        ORDER BY path ASC`,
        [projectId]
      );

      return res.json({
        success: true,
        files: result.rows
      });
    } catch (error) {
      console.error("AP-STREAM Hub list files error:", error);

      return res.status(500).json({
        success: false,
        error: "Failed to load project files"
      });
    }
  }
);


router.post(
  "/projects/:projectId/files",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = getUserId(req);
      const projectId = Number(req.params.projectId);

      if (
        !userId ||
        !Number.isInteger(projectId) ||
        projectId <= 0
      ) {
        return res.status(400).json({
          success: false,
          error: "Invalid project"
        });
      }

      if (!(await projectOwnedByUser(projectId, userId))) {
        return res.status(404).json({
          success: false,
          error: "Project not found"
        });
      }

      const filePath = String(req.body?.path || "").trim();
      const content = String(req.body?.content || "");

      if (!filePath) {
        return res.status(400).json({
          success: false,
          error: "File path is required"
        });
      }

      if (filePath.length > 2000) {
        return res.status(400).json({
          success: false,
          error: "File path is too long"
        });
      }

      const result = await db.query(
        `INSERT INTO ap_hub_files
          (project_id, path, content, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $4)
         RETURNING
          id,
          project_id,
          path,
          content,
          created_by,
          updated_by,
          created_at,
          updated_at`,
        [projectId, filePath, content, userId]
      );

      await db.query(
        `UPDATE ap_hub_projects
            SET updated_at = CURRENT_TIMESTAMP
          WHERE id = $1`,
        [projectId]
      );

      return res.status(201).json({
        success: true,
        file: result.rows[0]
      });
    } catch (error) {
      console.error("AP-STREAM Hub create file error:", error);

      if (error.code === "23505") {
        return res.status(409).json({
          success: false,
          error: "A file with that path already exists"
        });
      }

      return res.status(500).json({
        success: false,
        error: "Failed to create file"
      });
    }
  }
);


router.put(
  "/projects/:projectId/files/:fileId",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = getUserId(req);
      const projectId = Number(req.params.projectId);
      const fileId = Number(req.params.fileId);

      if (
        !userId ||
        !Number.isInteger(projectId) ||
        projectId <= 0 ||
        !Number.isInteger(fileId) ||
        fileId <= 0
      ) {
        return res.status(400).json({
          success: false,
          error: "Invalid project or file"
        });
      }

      if (!(await projectOwnedByUser(projectId, userId))) {
        return res.status(404).json({
          success: false,
          error: "Project not found"
        });
      }

      const pathProvided = req.body?.path !== undefined;
      const contentProvided = req.body?.content !== undefined;

      if (!pathProvided && !contentProvided) {
        return res.status(400).json({
          success: false,
          error: "Provide path or content to update"
        });
      }

      const filePath = pathProvided
        ? String(req.body.path || "").trim()
        : null;

      const content = contentProvided
        ? String(req.body.content || "")
        : null;

      if (pathProvided && !filePath) {
        return res.status(400).json({
          success: false,
          error: "File path cannot be empty"
        });
      }

      const result = await db.query(
        `UPDATE ap_hub_files
            SET path = COALESCE($1, path),
                content = COALESCE($2, content),
                updated_by = $3,
                updated_at = CURRENT_TIMESTAMP
          WHERE id = $4
            AND project_id = $5
       RETURNING
            id,
            project_id,
            path,
            content,
            created_by,
            updated_by,
            created_at,
            updated_at`,
        [filePath, content, userId, fileId, projectId]
      );

      if (!result.rows.length) {
        return res.status(404).json({
          success: false,
          error: "File not found"
        });
      }

      await db.query(
        `UPDATE ap_hub_projects
            SET updated_at = CURRENT_TIMESTAMP
          WHERE id = $1`,
        [projectId]
      );

      return res.json({
        success: true,
        file: result.rows[0]
      });
    } catch (error) {
      console.error("AP-STREAM Hub update file error:", error);

      if (error.code === "23505") {
        return res.status(409).json({
          success: false,
          error: "A file with that path already exists"
        });
      }

      return res.status(500).json({
        success: false,
        error: "Failed to update file"
      });
    }
  }
);


router.delete(
  "/projects/:projectId/files/:fileId",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = getUserId(req);
      const projectId = Number(req.params.projectId);
      const fileId = Number(req.params.fileId);

      if (
        !userId ||
        !Number.isInteger(projectId) ||
        projectId <= 0 ||
        !Number.isInteger(fileId) ||
        fileId <= 0
      ) {
        return res.status(400).json({
          success: false,
          error: "Invalid project or file"
        });
      }

      if (!(await projectOwnedByUser(projectId, userId))) {
        return res.status(404).json({
          success: false,
          error: "Project not found"
        });
      }

      const result = await db.query(
        `DELETE FROM ap_hub_files
          WHERE id = $1
            AND project_id = $2
       RETURNING id, path`,
        [fileId, projectId]
      );

      if (!result.rows.length) {
        return res.status(404).json({
          success: false,
          error: "File not found"
        });
      }

      await db.query(
        `UPDATE ap_hub_projects
            SET updated_at = CURRENT_TIMESTAMP
          WHERE id = $1`,
        [projectId]
      );

      return res.json({
        success: true,
        deleted: result.rows[0]
      });
    } catch (error) {
      console.error("AP-STREAM Hub delete file error:", error);

      return res.status(500).json({
        success: false,
        error: "Failed to delete file"
      });
    }
  }
);


// ----------------------------------------------------
// VERSIONS
// ----------------------------------------------------

router.post(
  "/projects/:projectId/versions",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = getUserId(req);
      const projectId = Number(req.params.projectId);
      const message = String(req.body?.message || "").trim();

      if (
        !userId ||
        !Number.isInteger(projectId) ||
        projectId <= 0
      ) {
        return res.status(400).json({
          success: false,
          error: "Invalid project"
        });
      }

      if (!message) {
        return res.status(400).json({
          success: false,
          error: "Version message is required"
        });
      }

      if (!(await projectOwnedByUser(projectId, userId))) {
        return res.status(404).json({
          success: false,
          error: "Project not found"
        });
      }

      const client = await db.connect();

      try {
        await client.query("BEGIN");

        const numberResult = await client.query(
          `SELECT COALESCE(MAX(version_number), 0) + 1 AS next_version
             FROM ap_hub_versions
            WHERE project_id = $1`,
          [projectId]
        );

        const versionNumber = Number(
          numberResult.rows[0].next_version
        );

        const result = await client.query(
          `INSERT INTO ap_hub_versions
            (project_id, version_number, message, created_by)
           VALUES ($1, $2, $3, $4)
           RETURNING
            id,
            project_id,
            version_number,
            message,
            created_by,
            created_at`,
          [projectId, versionNumber, message, userId]
        );

        await client.query(
          `INSERT INTO ap_hub_version_files
            (version_id, project_id, path, content, file_type)
           SELECT
            $1,
            project_id,
            path,
            content,
            'text'
           FROM ap_hub_files
           WHERE project_id = $2`,
          [result.rows[0].id, projectId]
        );

        await client.query(
          `UPDATE ap_hub_projects
              SET updated_at = CURRENT_TIMESTAMP
            WHERE id = $1`,
          [projectId]
        );

        await client.query("COMMIT");

        return res.status(201).json({
          success: true,
          version: result.rows[0]
        });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("AP-STREAM Hub create version error:", error);

      return res.status(500).json({
        success: false,
        error: "Failed to create version"
      });
    }
  }
);


router.get(
  "/projects/:projectId/versions",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = getUserId(req);
      const projectId = Number(req.params.projectId);

      if (
        !userId ||
        !Number.isInteger(projectId) ||
        projectId <= 0
      ) {
        return res.status(400).json({
          success: false,
          error: "Invalid project"
        });
      }

      if (!(await projectOwnedByUser(projectId, userId))) {
        return res.status(404).json({
          success: false,
          error: "Project not found"
        });
      }

      const result = await db.query(
        `SELECT
            id,
            project_id,
            version_number,
            message,
            created_by,
            created_at
         FROM ap_hub_versions
        WHERE project_id = $1
        ORDER BY version_number DESC`,
        [projectId]
      );

      return res.json({
        success: true,
        versions: result.rows
      });
    } catch (error) {
      console.error("AP-STREAM Hub list versions error:", error);

      return res.status(500).json({
        success: false,
        error: "Failed to load versions"
      });
    }
  }
);

/*
 * GET /projects/:projectId/versions/:versionId/files
 * Returns the exact source-file snapshot belonging to a Hub version.
 */
router.get(
  "/projects/:projectId/versions/:versionId/files",
  authenticateToken,
  async (req, res) => {
    try {
      const { projectId, versionId } = req.params;

      const versionResult = await pool.query(
        `SELECT id, project_id, version_number, name, message, created_at
         FROM ap_hub_versions
         WHERE id = $1 AND project_id = $2
         LIMIT 1`,
        [versionId, projectId]
      );

      if (versionResult.rows.length === 0) {
        return res.status(404).json({
          error: "Version not found"
        });
      }

      const filesResult = await pool.query(
        `SELECT id, version_id, project_id, path, content, file_type
         FROM ap_hub_version_files
         WHERE version_id = $1 AND project_id = $2
         ORDER BY path ASC`,
        [versionId, projectId]
      );

      return res.json({
        version: versionResult.rows[0],
        files: filesResult.rows,
        count: filesResult.rows.length
      });
    } catch (error) {
      console.error("AP-STREAM Hub version files error:", error);

      return res.status(500).json({
        error: "Failed to load version files"
      });
    }
  }
);

module.exports = router;
