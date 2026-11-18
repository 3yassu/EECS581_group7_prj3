pub struct SiteTags {
	pub ingredients_start: &'static str,
	pub ingredients_end: &'static str,
	pub ingredients_tags: [&'static str; 6],
    pub steps_start: &'static str,
    pub steps_end: &'static str,
	pub steps_tags: [&'static str; 2],
}

pub fn ingredient_tags(url: &str) -> Vec<SiteTags> {
	let url = url.to_ascii_lowercase();
	let tags = match url.as_str() {
		value if value.contains("allrecipes.com") => Some(SiteTags {
			ingredients_start: "<ul class=\"mm-recipes-structured-ingredients__list\">",
			ingredients_end: "</ul>",
			ingredients_tags: [
				".ingredients-item-name",
				".ingredients-item-name",
				".ingredients-item-unit",
				".ingredients-item-unit",
				".ingredients-item-name",
				".ingredients-item-name",
			],
            steps_start: "class=\"comp mntl-sc-block mntl-sc-block-startgroup mntl-sc-block-group--OL\">",
            steps_end: "</ol>",
			steps_tags: [".instructions-section-item", ".instructions-section-item"],
		}),
		_ => None,
	};

	tags.into_iter().collect()
}