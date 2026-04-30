const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const axios = require('axios')
const archiver = require('archiver')
const Config = require('../models/Config')
const { generateProjectScaffold } = require('../utils/projectGenerator')

const GITHUB_API = 'https://api.github.com'

const getUser = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'No token' })
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.userId
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

const loadConfigForUser = async (configId, userId) => {
  const config = await Config.findOne({
    _id: configId,
    userId
  })

  return config
}

const parseRepo = (repoFullName) => {
  if (!repoFullName || typeof repoFullName !== 'string' || !repoFullName.includes('/')) {
    throw new Error('repo must be in format owner/repo')
  }

  const [owner, repo] = repoFullName.split('/')
  if (!owner || !repo) {
    throw new Error('repo must be in format owner/repo')
  }

  return { owner, repo }
}

const githubRequest = async ({ method, path, token, data }) => {
  return axios({
    method,
    url: `${GITHUB_API}${path}`,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    data
  })
}

const ensureRepo = async ({ owner, repo, token, createIfMissing }) => {
  try {
    console.log(`[ensureRepo] Checking if repo exists: ${owner}/${repo}`)
    await githubRequest({
      method: 'get',
      path: `/repos/${owner}/${repo}`,
      token
    })
    console.log(`[ensureRepo] Repo already exists`)
    return
  } catch (err) {
    const status = err.response?.status
    console.log(`[ensureRepo] Get repo returned status ${status}`)
    
    if (status !== 404 || !createIfMissing) {
      console.error(`[ensureRepo] Error (won't create):`, err.response?.data || err.message)
      throw err
    }
  }

  console.log(`[ensureRepo] Creating new repo: ${repo}`)
  try {
    await githubRequest({
      method: 'post',
      path: '/user/repos',
      token,
      data: {
        name: repo,
        private: false,
        auto_init: true
      }
    })
    console.log(`[ensureRepo] Repo created successfully`)
  } catch (createErr) {
    console.error(`[ensureRepo] Failed to create repo:`, createErr.response?.data || createErr.message)
    throw createErr
  }
}

const upsertFile = async ({ owner, repo, token, path, content, message, branch }) => {
  let sha

  try {
    const existing = await githubRequest({
      method: 'get',
      path: `/repos/${owner}/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`,
      token
    })
    sha = existing.data?.sha
  } catch (err) {
    if (err.response?.status !== 404) {
      throw err
    }
  }

  await githubRequest({
    method: 'put',
    path: `/repos/${owner}/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`,
    token,
    data: {
      message,
      content: Buffer.from(content, 'utf8').toString('base64'),
      sha,
      branch
    }
  })
}

router.get('/:configId/export', getUser, async (req, res) => {
  try {
    const config = await loadConfigForUser(req.params.configId, req.userId)

    if (!config) return res.status(404).json({ error: 'Config not found' })

    const scaffold = generateProjectScaffold(config)

    return res.json({
      app: config.app,
      configId: config._id,
      scaffold
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

router.get('/:configId/export.zip', getUser, async (req, res) => {
  try {
    const config = await loadConfigForUser(req.params.configId, req.userId)
    if (!config) return res.status(404).json({ error: 'Config not found' })

    const scaffold = generateProjectScaffold(config)

    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="${scaffold.projectName}-scaffold.zip"`)

    const archive = archiver('zip', { zlib: { level: 9 } })
    archive.on('error', (err) => {
      throw err
    })

    archive.pipe(res)
    scaffold.files.forEach((file) => {
      archive.append(file.content, { name: `${scaffold.projectName}/${file.path}` })
    })

    await archive.finalize()
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

router.post('/:configId/push-github', getUser, async (req, res) => {
  try {
    const { repo, token, branch = 'main', createIfMissing = true } = req.body || {}
    
    console.log(`[push-github] Starting push. repo=${repo}, token=${token ? '***' : 'missing'}, branch=${branch}`)
    
    if (!repo || !token) {
      console.error('[push-github] Missing required fields')
      return res.status(400).json({ error: 'repo and token are required' })
    }

    const config = await loadConfigForUser(req.params.configId, req.userId)
    if (!config) {
      console.error('[push-github] Config not found')
      return res.status(404).json({ error: 'Config not found' })
    }

    console.log(`[push-github] Config found: ${config.app}`)
    
    const scaffold = generateProjectScaffold(config)
    console.log(`[push-github] Scaffold generated with ${scaffold.files.length} files`)
    
    const { owner, repo: repoName } = parseRepo(repo)
    console.log(`[push-github] Parsed repo: owner=${owner}, repo=${repoName}`)

    console.log(`[push-github] Ensuring repo exists...`)
    await ensureRepo({ owner, repo: repoName, token, createIfMissing })
    console.log(`[push-github] Repo ready`)

    const prefix = scaffold.projectName
    console.log(`[push-github] Pushing ${scaffold.files.length} files with prefix: ${prefix}`)
    
    for (const file of scaffold.files) {
      try {
        await upsertFile({
          owner,
          repo: repoName,
          token,
          path: `${prefix}/${file.path}`,
          content: file.content,
          message: `chore(generator): update ${file.path}`,
          branch
        })
        console.log(`[push-github] ✓ Pushed ${file.path}`)
      } catch (fileErr) {
        console.error(`[push-github] ✗ Failed to push ${file.path}:`, fileErr.message)
        throw fileErr
      }
    }

    console.log(`[push-github] Success! All files pushed.`)
    return res.json({
      message: 'Scaffold pushed to GitHub successfully',
      repository: `${owner}/${repoName}`,
      branch,
      filesPushed: scaffold.files.length,
      projectPath: prefix
    })
  } catch (err) {
    console.error('[push-github] Error:', err.message)
    if (err.response?.data) {
      console.error('[push-github] GitHub API response:', err.response.data)
    }
    const message = err.response?.data?.message || err.message || 'Unknown error'
    return res.status(500).json({ error: message, details: err.response?.data })
  }
})

module.exports = router
