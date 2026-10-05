# Android 0.4.5

- Small night/light toggle at the top right, next to a red dice Surprise Me button. Phones use compact accessible icon controls; TV shows the Surprise Me label.
- Surprise Me samples a real movie from a random page of TMDB discovery, using different sort orders and avoiding the last 20 picks when alternatives are available. Released, non-adult movies with at least 20 votes are eligible. It does not invent IDs or limit selection to the home catalog; selection is not uniform over the entire TMDB database. Playback availability depends on the chosen source.
- Categories in the TV side rail and phone bottom navigation, with TMDB movie/series genres and paginated genre results.
- Watch Now uses the selected source directly. A separate Source control beside Watch Now changes that preference; VidStuck is marked Recommended. Source controls are available in the home carousel and title details.
- Title details put Watch Now and Source to the right of the poster/title on TV and beneath the title beside the poster on phones, above the synopsis and cast.
- TV has a dimmed, softly blurred backdrop behind the interface, using the existing bounded bitmap blur and image cache. Text and controls remain sharp.

Only Android mobile and TV builds were requested for this release. Windows remains at 0.4.4. Playback guards and ad filtering are unchanged from the working 0.4.4 release.
