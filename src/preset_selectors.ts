// Manually defined table of presets
export type Preset = {name: string, sel: string, pat: string};
export type SitePresets = {name: string, value: Record<string, Preset>};

export const table: Record<string, SitePresets> = {
	instagram: {
		name: "Instagram",
		value: {
			suggested: {
				name: "Instagram Suggested Posts",
				sel: 'div ~ article, article:has(svg[aria-label="Close"])',
				pat: "https://www.instagram.com/<",
			},
			explore_reels: {
				name: "Explore + Reels (Also hides reel posts on desktop)",
				sel: 'a[href*="explore"], a[href*="reels"]',
				pat: "https://www.instagram.com",
			},
			stories: {
				name: "Stories",
				sel: 'div[data-pagelet="story_tray"]',
				pat: "https://www.instagram.com",
			},
			suggested_accounts: {
				name: "Suggested Accounts",
				sel: '[role="main"] > div > div:nth-of-type(2)',
				pat: "https://www.instagram.com/<",
			},
			post_comments: {
				name: "Post Comments",
				sel: '[role="presentation"] > div:nth-of-type(2), span:has([aria-label="Comment"]), span:has([aria-label="Comment"]) + span, [aria-label="Comment"], [aria-label="Comment"] + div',
				pat: "https://www.instagram.com/"
			}
		}
	},
	reddit: {
		name: "Reddit",
		value: {
			homepage: {
				name: "Home Page",
				sel: ".grid-container",
				pat: "https://www.reddit.com/<",
			},
			subreddit_feed: {
				name: "Subreddit Feed",
				sel: ".grid-container",
				pat: "https://www.reddit.com/r/**/<",
			},
			comments: {
				name: "Comments",
				sel: "#comment-tree",
				pat: "https://www.reddit.com/r/*/comments",
			},
			left_sidebar: {
				name: "Left Sidebar",
				sel: "#left-sidebar",
				pat: "https://www.reddit.com"
			}
		}
	},
	old_reddit: {
		name: "Old Reddit",
		value: {
			homepage: {
				name: "Home Page",
				sel: "[role=main]",
				pat: "https://old.reddit.com/<"
			},
			subreddit_feed: {
				name: "Subreddit Feed",
				sel: "[role=main]",
				pat: "https://old.reddit.com/r/**/<"
			},
			comments: {
				name: "Comments",
				sel: ".nestedlisting",
				pat: "https://old.reddit.com/r/*/comments"
			}
		}
	},
	youtube: {
		name: "YouTube",
		value: {
			home_feed: {
				name: "Home Feed",
				sel: '[page-subtype="home"], [tab-title="Home"]',
				pat: 'https://*.youtube.com/'
			},
			shorts: {
				name: "Shorts",
				// Nav bar shorts icon, shorts tab in channel, shorts display in channel, shorts on home page, shorts player, mobile navbar, mobile home, mobile shorts player
				sel: 'a[title="Shorts"], [tab-title="Shorts"], .shortsLockupViewModelHost, [is-shorts], #shorts-inner-container, .pivot-shorts, .reel-shelf-header, shorts-page',
				pat: "https://*.youtube.com/"
			},
			sidebar: {
				name: "Related Videos",
				sel: "#related, .related-items-container, .single-column-watch-next-modern-panels",
				pat: "https://*.youtube.com/"
			},
			comments: {
				name: "Comments",
				sel: '#comments, ytm-item-section-renderer:has([aria-label="Comments"])',
				pat: "https://*.youtube.com/"
			},
			end_cards: {
				name: "Video End Screen Cards",
				sel: '.ytp-fullscreen-grid-stills-container',
				pat: "https://*.youtube.com/"
			},
			search: {
				name: "Search",
				sel: '[role="search"], #voice-search-button, [aria-label="Search YouTube"]',
				pat: "https://*.youtube.com/"
			},
			playables: {
				name: "Playables",
				sel: 'ytd-rich-shelf-renderer:has([href*="playable"]), ytm-rich-section-renderer:has([href*="playable"])',
				pat: "https://*.youtube.com/"
			},
			explore: {
				name: "Explore Menu",
				sel: 'ytd-guide-section-renderer:nth-of-type(4)',
				pat: "https://*.youtube.com/"
			},
			left_sidebar: {
				name: "Left Sidebar",
				sel: '#guide-inner-content',
				pat: "https://*.youtube.com/"
			}
			
		}
	},
	twitter: {
		name: "Twitter/X",
		value: {
			foryou: {
				name: "For You Feed",
				sel: 'html:has(div:nth-of-type(1) > [role="tab"][aria-selected="true"]) [aria-label="Timeline: Your Home Timeline"]',
				pat: "https://x.com/home"
			},
			explore: {
				name: "Explore",
				sel: '[href="/explore"]',
				pat: "https://x.com"
			},
			sidebar: {
				name: "Right Sidebar",
				sel: '[data-testid="sidebarColumn"]',
				pat: "https://x.com"
			},
			replies: {
				name: "Replies",
				sel: '[data-testid="cellInnerDiv"]:not(:first-child)',
				pat: "https://x.com/*/status"
			},
			who_to_follow: {
				name: "Follow Recommendations",
				sel: '[aria-label="Who to follow"], [href*="connect_people"]',
				pat: "https://x.com"
			}
		}
	},
	facebook: {
		name: "Facebook",
		value: {
			home: {
				name: "Home Feed",
				sel: '[role="main"], #app-body [role="tablist"] ~ div',
				pat: "https://www.facebook.com/<"
			},
			reels: {
				name: "Reels",
				sel: '[aria-label*="reel" i], [href*="facebook.com/reel"], [data-pagelet]:has(video), .vscroller',
				pat: "https://www.facebook.com"
			},
			games: {
				name: "Gaming",
				sel: '[href*="facebook.com/gaming"], [aria-label="Gaming"]',
				pat: "https://www.facebook.com"
			}
		}
	},
	linkedin: {
		name: "LinkedIn",
		value: {
			home_feed: {
				name: "Home Feed",
				sel: "#workspace",
				pat: "https://www.linkedin.com/feed/<"
			},
			sidebar: {
				name: "News/Games Sidebar",
				sel: "#feed-news-module",
				pat: "https://www.linkedin.com/feed"
			},
		}
	}
}

export function getByID(id: string): Preset {
	const [site, preset] = id.split("%");
	return table[site].value[preset];
}