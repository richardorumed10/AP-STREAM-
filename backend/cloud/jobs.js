const jobs = [];
let nextId = 1;

function createJob({ type = "general", name = "AP-STREAM Job", status = "queued", metadata = {} } = {}) {
  const job = {
    id: `job-${nextId++}`,
    type,
    name,
    status,
    metadata,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  jobs.unshift(job);

  // Keep the in-memory job registry bounded.
  if (jobs.length > 100) {
    jobs.length = 100;
  }

  return job;
}

function updateJob(id, updates = {}) {
  const job = jobs.find(item => item.id === id);
  if (!job) return null;

  Object.assign(job, updates, {
    updatedAt: new Date().toISOString()
  });

  return job;
}

function getJobs({ limit = 25 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);
  return jobs.slice(0, safeLimit);
}

function getJobsStatus() {
  const counts = {
    queued: 0,
    running: 0,
    completed: 0,
    failed: 0
  };

  for (const job of jobs) {
    if (Object.prototype.hasOwnProperty.call(counts, job.status)) {
      counts[job.status]++;
    }
  }

  return {
    service: "AP-STREAM Cloud Jobs",
    status: "online",
    total: jobs.length,
    counts,
    jobs: getJobs()
  };
}

module.exports = {
  createJob,
  updateJob,
  getJobs,
  getJobsStatus
};
