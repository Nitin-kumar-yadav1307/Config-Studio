const safeName = (value, fallback = 'generated_app') => {
  if (!value || typeof value !== 'string') return fallback
  const normalized = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')
  return normalized || fallback
}

const toTitle = (value) => {
  if (!value || typeof value !== 'string') return ''
  return value
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ')
}

const typeToTs = (type) => {
  if (type === 'number') return 'number'
  if (type === 'boolean') return 'boolean'
  return 'string'
}

const generateEntityType = (entity) => {
  const fields = (entity.fields || [])
    .map((field) => `  ${field.name}${field.required ? '' : '?'}: ${typeToTs(field.type)};`)
    .join('\n')

  return `export type ${toTitle(entity.name).replace(/\s+/g, '')} = {\n${fields}\n};\n`
}

const generateFormSchema = (entity) => {
  return JSON.stringify({
    entity: entity.name,
    title: `${toTitle(entity.name)} Form`,
    fields: entity.fields || []
  }, null, 2)
}

const generateApiContract = (config) => {
  return JSON.stringify({
    app: config.app,
    entities: (config.entities || []).map((entity) => ({
      entity: entity.name,
      endpoints: {
        list: `GET /api/${entity.name}`,
        create: `POST /api/${entity.name}`,
        update: `PUT /api/${entity.name}/:id`,
        remove: `DELETE /api/${entity.name}/:id`
      },
      schema: (entity.fields || []).reduce((acc, field) => {
        acc[field.name] = {
          type: field.type,
          required: Boolean(field.required)
        }
        return acc
      }, {})
    }))
  }, null, 2)
}

const generateExpressRoute = (entity) => {
  const routeName = entity.name
  return `import { Router } from 'express';\n\nconst router = Router();\n\nrouter.get('/', async (_req, res) => {\n  // Replace with your real data layer\n  res.json([]);\n});\n\nrouter.post('/', async (req, res) => {\n  // Replace with your real data layer\n  res.status(201).json(req.body);\n});\n\nrouter.put('/:id', async (req, res) => {\n  res.json({ id: req.params.id, ...req.body });\n});\n\nrouter.delete('/:id', async (req, res) => {\n  res.json({ message: '${routeName} deleted', id: req.params.id });\n});\n\nexport default router;\n`
}

const generateFrontendPage = (entity) => {
  const typeName = toTitle(entity.name).replace(/\s+/g, '')
  return `import { useMemo, useState } from 'react';\nimport schema from '../schemas/${entity.name}.json';\n\nexport default function ${typeName}Page() {\n  const [rows, setRows] = useState([]);\n\n  const requiredFields = useMemo(() => schema.fields.filter((f) => f.required), []);\n\n  return (\n    <div style={{ padding: 20 }}>\n      <h1>${toTitle(entity.name)}</h1>\n      <p>Generated from JSON config. Required fields: {requiredFields.length}</p>\n      <pre>{JSON.stringify(rows, null, 2)}</pre>\n      <button onClick={() => setRows((prev) => [...prev, { createdAt: new Date().toISOString() }])}>Add Row</button>\n    </div>\n  );\n}\n`
}

const generateReadme = (config) => {
  const entities = (config.entities || []).map((entity) => `- ${entity.name} (${(entity.fields || []).length} fields)`).join('\n')
  return `# ${config.app} (Generated)\n\nThis scaffold was generated from your app-builder configuration.\n\n## Entities\n${entities}\n\n## Notes\n- Frontend and backend files are generated from config, not hardcoded per app.\n- Replace mock route logic with real persistence adapters as needed.\n`}

const generateProjectScaffold = (config) => {
  const projectName = safeName(config.app)
  const files = []

  files.push({
    path: 'README.md',
    content: generateReadme(config)
  })

  files.push({
    path: 'app-config.json',
    content: JSON.stringify(config, null, 2)
  })

  files.push({
    path: 'backend/contracts/api.contract.json',
    content: generateApiContract(config)
  })

  files.push({
    path: 'backend/src/index.ts',
    content: `import express from 'express';\n${(config.entities || []).map((entity) => `import ${entity.name}Routes from './routes/${entity.name}';`).join('\n')}\n\nconst app = express();\napp.use(express.json());\n\n${(config.entities || []).map((entity) => `app.use('/api/${entity.name}', ${entity.name}Routes);`).join('\n')}\n\napp.listen(4000, () => console.log('Generated API server on 4000'));\n`
  })

  ;(config.entities || []).forEach((entity) => {
    files.push({ path: `backend/src/routes/${entity.name}.ts`, content: generateExpressRoute(entity) })
    files.push({ path: `frontend/src/pages/${entity.name}.tsx`, content: generateFrontendPage(entity) })
    files.push({ path: `frontend/src/schemas/${entity.name}.json`, content: generateFormSchema(entity) })
    files.push({ path: `shared/types/${entity.name}.ts`, content: generateEntityType(entity) })
  })

  files.push({
    path: 'frontend/src/App.tsx',
    content: `import React from 'react';\n\nexport default function App() {\n  return <div style={{ padding: 24 }}><h1>${config.app}</h1><p>Generated app scaffold</p></div>;\n}\n`
  })

  files.push({
    path: 'frontend/src/main.tsx',
    content: `import React from 'react';\nimport { createRoot } from 'react-dom/client';\nimport App from './App';\n\ncreateRoot(document.getElementById('root')!).render(<App />);\n`
  })

  return {
    projectName,
    generatedAt: new Date().toISOString(),
    files,
    summary: {
      entityCount: (config.entities || []).length,
      fileCount: files.length,
      frontendPageCount: (config.entities || []).length,
      backendRouteCount: (config.entities || []).length
    }
  }
}

module.exports = {
  generateProjectScaffold
}
