pub struct SiteTags {
	pub title_start: &'static str,
	pub title_end: &'static str,
	pub time_start: &'static str,
	pub time_end: &'static str,
	pub ingredients_start: &'static str,
	pub ingredients_end: &'static str,
	pub servings_start: &'static str,
	pub servings_end: &'static str,
	pub ingredient_item_start: &'static str,
	pub ingredient_item_end: &'static str,
	// [quantity_start, quantity_end, unit_start, unit_end, name_start, name_end]
	pub ingredients_tags: [&'static str; 6],
    pub steps_start: &'static str,
    pub steps_end: &'static str,
	// [step_start, step_end]
	pub steps_tags: [&'static str; 2],
}

pub fn tags(url: &str) -> Vec<SiteTags> {
	let url = url.to_ascii_lowercase();
	let tags = match url.as_str() {
		value if value.contains("allrecipes.com") => Some(SiteTags {
			title_start: "<h1 class=\"article-heading text-headline-400\">",
			title_end: "</h1>",
			time_start: "<div class=\"mm-recipes-details__label\">Total Time:</div>\n<div class=\"mm-recipes-details__value\">",
			time_end: "</div>",
			servings_start: "<div class=\"mm-recipes-details__label\">Servings:</div>\n<div class=\"mm-recipes-details__value\">",
			servings_end: "</div>",
			ingredients_start: "<ul class=\"mm-recipes-structured-ingredients__list\">",
			ingredients_end: "</ul>",
			ingredient_item_start: "mm-recipes-structured-ingredients__list-item",
			ingredient_item_end: "</li>",
			ingredients_tags: [
				"data-ingredient-quantity=\"true\">",
				"</span>",
				"data-ingredient-unit=\"true\">",
				"</span>",
				"data-ingredient-name=\"true\">",
				"</span>",
			],
            steps_start: "class=\"comp mntl-sc-block mntl-sc-block-startgroup mntl-sc-block-group--OL\">",
            steps_end: "</ol>",
			// The block id in the <p> tag varies per recipe, so match on its stable class instead.
			steps_tags: ["class=\"comp mntl-sc-block mntl-sc-block-html\">", "</p>"],
		}),
		_ => None,
	};

	tags.into_iter().collect()
}