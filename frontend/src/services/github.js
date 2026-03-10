export async function fetchRepos(username) {

    const response = await fetch(
        `https://api.github.com/users/${username}/repos`
    );

    if (!response.ok) {
        throw new Error("GitHub user not found");
    }

    const repos = await response.json();

    return repos.map(repo => ({
        name: repo.name,
        description: repo.description,
        url: repo.html_url,
        stars: repo.stargazers_count,
        language: repo.language
    }));

}