import { mockJobs } from "../data/jobs.mock.js";

export function searchJobs(criteria) {
  const { role, location, technologies } = criteria;

  return mockJobs.filter(job => {
    const matchesRole =
      !role || job.title.toLowerCase().includes(role.toLowerCase());

    const matchesLocation =
      !location || job.location.toLowerCase().includes(location.toLowerCase());

    const matchesTech =
      !technologies?.length ||
      technologies.every(t =>
        job.technologies.map(x => x.toLowerCase()).includes(t.toLowerCase())
      );

    return matchesRole && matchesLocation && matchesTech;
  });
}