
// Factory method used to produce a nice dispaly card on the home page
// See samples-list.js for the list of samples

export function createSampleHomeCard(sample) {
    const tagsHtml = sample.tags?.length > 0 ? sample.tags.map(tag =>
        `<span class="sample-home-card-tag mr-1" style="border-color: ${tag.color || '#6c757d'}">${tag.title}</span>`
    ).join('') : '';

    const card = document.createElement('a');
    if (sample.useSampleViewer) {
        card.href = `sample-viewer.html?sample=${sample.link}`;
    } else {
        card.href = sample.link;
    }

    card.className = 'sample-home-card';

    const mediaContainer = document.createElement('div');
    mediaContainer.className = 'sample-home-card-media-container';

    const image = document.createElement('img');
    image.src = sample.image;
    image.className = 'sample-home-card-img';
    image.alt = sample.name;
    mediaContainer.appendChild(image);

    let video;
    if (sample.onHoverMedia) {
        video = document.createElement('video');
        video.className = 'sample-home-card-video';
        video.muted = true;
        video.loop = true;
        video.playsInline = true;

        // Lazy load video source
        const videoSource = document.createElement('source');
        videoSource.setAttribute('data-src', sample.onHoverMedia);
        videoSource.type = 'video/mp4';
        video.appendChild(videoSource);
        
        mediaContainer.appendChild(video);

        card.addEventListener('mouseenter', () => {
            if (video.currentSrc === '') {
                video.src = sample.onHoverMedia;
            }
            video.play();
            image.style.opacity = '0';
            video.style.opacity = '1';
        });

        card.addEventListener('mouseleave', () => {
            video.pause();
            video.currentTime = 0;
            image.style.opacity = '1';
            video.style.opacity = '0';
        });
    }

    card.innerHTML = `
        <div class="sample-home-card-body">
            <h5 class="sample-home-card-title">${sample.name}</h5>
            <div class="sample-home-card-tags">${tagsHtml}</div>
            <p class="sample-home-card-description">${sample.description}</p>
        </div>
    `;

    card.insertBefore(mediaContainer, card.firstChild);

    return card;
}

// Factory method for cards without images - focuses on title and description
export function createSampleHomeCardNoImage(sample) {
    const tagsHtml = sample.tags?.length > 0 ? sample.tags.map(tag =>
        `<span class="sample-home-card-tag mr-1" style="border-color: ${tag.color || '#6c757d'}">${tag.title}</span>`
    ).join('') : '';

    const card = document.createElement('a');
    if (sample.useSampleViewer) {
        card.href = `sample-viewer.html?sample=${sample.link}`;
    } else {
        card.href = sample.link;
    }

    card.className = 'sample-home-card sample-home-card-no-image';

    card.innerHTML = `
        <div class="sample-home-card-body">
            <h5 class="sample-home-card-title">${sample.name}</h5>
            ${tagsHtml ? `<div class="sample-home-card-tags">${tagsHtml}</div>` : ''}
            <p class="sample-home-card-description">${sample.description}</p>
        </div>
    `;

    return card;
} 