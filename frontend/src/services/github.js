export async function analyzeGithub(username) {

    const reposRes = await fetch(
        `https://api.github.com/users/${username}/repos`
    );

    const repos = await reposRes.json();

    const technologies = new Set();

    for (const repo of repos) {

        const langRes = await fetch(
            `https://api.github.com/repos/${username}/${repo.name}/languages`
        );

        const languages = await langRes.json();

        Object.keys(languages).forEach(lang => {
            technologies.add(lang);
        });

    }

    return Array.from(technologies);
}