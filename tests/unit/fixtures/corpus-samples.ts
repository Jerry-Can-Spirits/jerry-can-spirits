// Real documents from the live dataset, one minimal set per type chosen to
// exhibit every field the corpus uses. Strings are truncated to a few words:
// the coverage test reads which fields carry prose, never how much, and short
// values keep the fixture legible.
//
// Regenerate when the schema gains a field that no existing document has.
export const CORPUS_SAMPLES: Record<string, Array<Record<string, unknown>>> = {
  "guide": [
    {
      "_createdAt": "2026-01-18T10:12:05Z",
      "_id": "2d13be57-2ee9-4b5c-8311-81a51e5d7e6e",
      "_rev": "1jJ4sZyHE3MNejrOVPA5CZ",
      "_system": {
        "base": {
          "id": "2d13be57-2ee9-4b5c-8311-81a51e5d7e6e",
          "rev": "mJnjegxN03zZDJ8JMuJXHp"
        }
      },
      "_type": "guide",
      "_updatedAt": "2026-08-02T09:39:53Z",
      "author": "Jerry Can Spirits",
      "callToAction": {
        "text": "Try British Craft Spiced",
        "url": "/shop/product/jerry-can-spirits-expedition-spiced-rum/"
      },
      "category": "spirits-education",
      "comparisonTables": [
        {
          "_key": "8e58ca353522",
          "_type": "table",
          "caption": "How major rum-producing regions",
          "headers": [
            "Region ",
            "Base Rum Style "
          ],
          "rows": [
            {
              "_key": "4725b791ee53",
              "_type": "row",
              "cells": [
                "Jamaica ",
                "Heavy, funky pot still"
              ]
            },
            {
              "_key": "5789c62e40e7",
              "_type": "row",
              "cells": [
                "Barbados ",
                "Balanced, refined "
              ]
            }
          ]
        }
      ],
      "estimatedWordCount": 1797,
      "excerpt": "Spiced rum has Caribbean",
      "faqs": [
        {
          "_key": "34704082db0c",
          "_type": "faq",
          "answer": "No. While the Caribbean",
          "question": "Can rum only be"
        },
        {
          "_key": "da2703698280",
          "_type": "faq",
          "answer": "Yes, provided it meets",
          "question": "Is UK rum actually"
        }
      ],
      "featured": false,
      "featuredDistilleries": [
        {
          "_key": "6650f15059c7",
          "_type": "distillery",
          "description": "One of few UK",
          "location": "Dumfries, Scotland",
          "name": "Ninefold Distillery",
          "relationship": "editorial",
          "speciality": "From-scratch Scottish rum",
          "website": "https://www.ninefolddistillery.com/"
        },
        {
          "_key": "7b1276074fad",
          "_type": "distillery",
          "description": "Carbon-negative distillery producing rum",
          "location": "Exeter, Devon",
          "name": "Two Drifters",
          "relationship": "editorial",
          "speciality": "Sustainable, carbon-negative rum",
          "website": "https://twodriftersrum.com/"
        }
      ],
      "heroImage": {
        "_type": "image",
        "asset": {
          "_ref": "image-1ac918b8c7d05c10a48e2e47d5c312e1bc8656e2-1536x1024-webp",
          "_type": "reference"
        }
      },
      "introduction": "While spiced rum has",
      "isPillar": false,
      "keywords": [
        "where is spiced rum",
        "spiced rum origin"
      ],
      "metaDescription": "Spiced rum originated in",
      "metaTitle": "Where Is Spiced Rum",
      "publishedAt": "2026-01-18T10:13:00.000Z",
      "relatedCocktails": [
        {
          "_key": "25d42fb3ae5d",
          "_ref": "5c03a375-ba99-4ea7-a992-c7a9674a5322",
          "_type": "reference"
        },
        {
          "_key": "58035d4c743b",
          "_ref": "26256604-efea-40c2-b59e-c78595d22fd3",
          "_type": "reference"
        }
      ],
      "relatedGuides": [
        {
          "_key": "fd21daacde1d",
          "_ref": "3d0ccbfd-9eb6-4f5b-bdca-22828becddef",
          "_type": "reference"
        },
        {
          "_key": "6fc66bca6a08",
          "_ref": "b3d4e188-b8ac-4747-bda6-44084ff4cb5e",
          "_type": "reference"
        }
      ],
      "relatedProducts": [
        {
          "_key": "1f4a0d908229",
          "_type": "product",
          "contextNote": "Jerry Can Spirits represents",
          "shopifyHandle": "jerry-can-spirits-expedition-spiced-rum"
        }
      ],
      "sections": [
        {
          "_key": "80d53cb067d7",
          "_type": "contentSection",
          "content": "The Caribbean remains rum's",
          "contentRich": [
            {
              "_key": "rfk91hu1",
              "_type": "block",
              "children": [
                {
                  "_key": "rfm220pm",
                  "_type": "span",
                  "marks": [],
                  "text": "The Caribbean remains rum's"
                },
                {
                  "_key": "rfm3n57",
                  "_type": "span",
                  "marks": [
                    "rfm11949"
                  ],
                  "text": "spiced rum"
                }
              ],
              "markDefs": [
                {
                  "_key": "rfm11949",
                  "_type": "internalLink",
                  "reference": {
                    "_ref": "0db9e705-a190-4300-bb5a-ed1548367acf",
                    "_type": "reference"
                  }
                }
              ],
              "style": "normal"
            }
          ],
          "heading": "The Caribbean: Where It",
          "subsections": [
            {
              "_key": "356fe38fa6c9",
              "_type": "subsection",
              "content": "Jamaican rum is known",
              "contentRich": [
                {
                  "_key": "rfkbvuz",
                  "_type": "block",
                  "children": [
                    {
                      "_key": "rfm6sri",
                      "_type": "span",
                      "marks": [],
                      "text": "Jamaican rum is known"
                    },
                    {
                      "_key": "rfm71kcv",
                      "_type": "span",
                      "marks": [
                        "rfm5165"
                      ],
                      "text": "banana"
                    }
                  ],
                  "markDefs": [
                    {
                      "_key": "rfm5165",
                      "_type": "internalLink",
                      "reference": {
                        "_ref": "ingredient-banana",
                        "_type": "reference"
                      }
                    }
                  ],
                  "style": "normal"
                },
                {
                  "_key": "rfkd9vx",
                  "_type": "block",
                  "children": [
                    {
                      "_key": "rfke11ha",
                      "_type": "span",
                      "marks": [],
                      "text": "Key characteristics:"
                    }
                  ],
                  "markDefs": [],
                  "style": "normal"
                }
              ],
              "subheading": "Jamaica"
            },
            {
              "_key": "e392218aeb81",
              "_type": "subsection",
              "content": "Often credited as rum's",
              "contentRich": [
                {
                  "_key": "rfkn1ic7",
                  "_type": "block",
                  "children": [
                    {
                      "_key": "rfko4rs",
                      "_type": "span",
                      "marks": [],
                      "text": "Often credited as rum's"
                    }
                  ],
                  "markDefs": [],
                  "style": "normal"
                },
                {
                  "_key": "rfkpwd5",
                  "_type": "block",
                  "children": [
                    {
                      "_key": "rfkq1nyi",
                      "_type": "span",
                      "marks": [],
                      "text": "Key characteristics:"
                    }
                  ],
                  "markDefs": [],
                  "style": "normal"
                }
              ],
              "subheading": "Barbados"
            }
          ]
        },
        {
          "_key": "befd88b1c865",
          "_type": "contentSection",
          "content": "Britain might seem an",
          "contentRich": [
            {
              "_key": "rfmd1vlh",
              "_type": "block",
              "children": [
                {
                  "_key": "rfmq14ia",
                  "_type": "span",
                  "marks": [],
                  "text": "Britain might seem an"
                },
                {
                  "_key": "rfmr1w3n",
                  "_type": "span",
                  "marks": [
                    "rfmpcwx"
                  ],
                  "text": "spiced rum"
                }
              ],
              "markDefs": [
                {
                  "_key": "rfmpcwx",
                  "_type": "internalLink",
                  "reference": {
                    "_ref": "0db9e705-a190-4300-bb5a-ed1548367acf",
                    "_type": "reference"
                  }
                }
              ],
              "style": "normal"
            }
          ],
          "heading": "Britain's Rum Renaissance",
          "subsections": [
            {
              "_key": "662159f33d22",
              "_type": "subsection",
              "content": "Britain's relationship with Caribbean",
              "contentRich": [
                {
                  "_key": "rfmf19mf",
                  "_type": "block",
                  "children": [
                    {
                      "_key": "rfmg217s",
                      "_type": "span",
                      "marks": [],
                      "text": "Britain's relationship with Caribbean"
                    }
                  ],
                  "markDefs": [],
                  "style": "normal"
                }
              ],
              "subheading": "Historical Connection"
            },
            {
              "_key": "c6f79c8fef00",
              "_type": "subsection",
              "content": "The UK's gin renaissance",
              "contentRich": [
                {
                  "_key": "rfmhnnd",
                  "_type": "block",
                  "children": [
                    {
                      "_key": "rfmi1f8q",
                      "_type": "span",
                      "marks": [],
                      "text": "The UK's gin renaissance"
                    }
                  ],
                  "markDefs": [],
                  "style": "normal"
                }
              ],
              "subheading": "The Craft Distilling Boom"
            }
          ]
        }
      ],
      "slug": {
        "_type": "slug",
        "current": "where-is-spiced-rum-made"
      },
      "title": "Where Is Spiced Rum"
    }
  ],
  "cocktail": [
    {
      "_createdAt": "2026-01-09T10:46:32Z",
      "_id": "03a3d5b1-7f8d-400a-aec9-789b198d9038",
      "_rev": "M6rqUqK2q7kn0cC5iwVvA0",
      "_system": {
        "base": {
          "id": "03a3d5b1-7f8d-400a-aec9-789b198d9038",
          "rev": "qr3YNYY04SHk5TuVG6SUiJ"
        }
      },
      "_type": "cocktail",
      "_updatedAt": "2026-07-25T09:23:21Z",
      "author": "Jerry Can Spirits",
      "baseSpirit": "bourbon",
      "description": "The Whiskey Sour is",
      "difficulty": "novice",
      "family": "sours",
      "faqs": [
        {
          "_key": "q11rld",
          "answer": "Bourbon, fresh lemon juice,",
          "question": "What is a Whiskey"
        },
        {
          "_key": "q121j6q",
          "answer": "The egg white version:",
          "question": "What is a Boston"
        }
      ],
      "featured": false,
      "featuredSpirit": {
        "_ref": "e9fad3cf-f71f-4169-b133-76721e76218e",
        "_type": "reference"
      },
      "flavorProfile": [
        "Citrus",
        "Vanilla"
      ],
      "garnish": "Luxardo Maraschino Cherry, orange",
      "garnishes": [
        {
          "_key": "gr1rld",
          "_type": "garnishItem",
          "ingredient": {
            "_ref": "bad94352-f3e4-4a0e-9409-a1186d96acaf",
            "_type": "reference"
          }
        },
        {
          "_key": "gr21j6q",
          "_type": "garnishItem",
          "ingredient": {
            "_ref": "ingredient-orange-slice",
            "_type": "reference"
          }
        }
      ],
      "glassware": {
        "_ref": "b3968034-7651-400c-8421-1a95c90d18b2",
        "_type": "reference"
      },
      "image": {
        "_type": "image",
        "asset": {
          "_ref": "image-9e6633e4ff3f58a8b4c4ec7e04b2b531e9e809c5-1184x864-webp",
          "_type": "reference"
        }
      },
      "ingredients": [
        {
          "_key": "40e6df1b390b",
          "_type": "cocktailIngredient",
          "amount": "60ml",
          "description": "A bourbon with genuine",
          "ingredientRef": {
            "_ref": "e9fad3cf-f71f-4169-b133-76721e76218e",
            "_type": "reference"
          },
          "name": "Bourbon whiskey"
        },
        {
          "_key": "0d8613ccec0a",
          "_type": "cocktailIngredient",
          "amount": "25ml",
          "description": "Squeezed immediately before use.",
          "ingredientRef": {
            "_ref": "60de2b4a-4282-405d-8f00-74811ed36fdc",
            "_type": "reference"
          },
          "name": "Fresh lemon juice"
        }
      ],
      "instructions": [
        "Squeeze lemon juice immediately",
        "Add egg white to"
      ],
      "keywords": [
        "Whiskey Sour recipe",
        "classic Whiskey Sour"
      ],
      "longDescription": [
        {
          "_key": "trim1rld",
          "_type": "block",
          "children": [
            {
              "_key": "trim21j6q",
              "_type": "span",
              "marks": [],
              "text": "The Origin"
            }
          ],
          "markDefs": [],
          "style": "h2"
        },
        {
          "_key": "trim35mb",
          "_type": "block",
          "children": [
            {
              "_key": "trim4x7o",
              "_type": "span",
              "marks": [],
              "text": "The Whiskey Sour appeared"
            }
          ],
          "markDefs": [],
          "style": "normal"
        }
      ],
      "metaDescription": "Jerry Thomas documented this",
      "metaTitle": "Whiskey Sour Recipe: The",
      "name": "Whiskey Sour",
      "note": "The double dry shake,",
      "prepTime": "PT5M",
      "relatedCocktails": [
        {
          "_key": "cc7a34dd80e3",
          "_ref": "96ad1dff-4299-4ab1-9cf5-dadcbe3c3e7b",
          "_type": "reference"
        },
        {
          "_key": "46f3d306f341",
          "_ref": "1fafd150-5c1f-4266-b20d-b99c3e0a0baa",
          "_type": "reference"
        }
      ],
      "relatedGuides": [
        {
          "_key": "01690b4ec8c3",
          "_type": "guideLink",
          "guide": {
            "_ref": "ba4d681f-472d-4512-ae03-ed16747fa4f7",
            "_type": "reference"
          }
        }
      ],
      "servings": "1 cocktail",
      "slug": {
        "_type": "slug",
        "current": "whiskey-sour"
      },
      "tags": [
        "high-abv",
        "spirit-forward"
      ],
      "variants": [
        {
          "_key": "vb0062",
          "_type": "variant",
          "description": "The whiskey sour with",
          "difficulty": "trailblazer",
          "ingredients": [
            {
              "_key": "vb0058",
              "_type": "variantIngredient",
              "amount": "60ml",
              "ingredientRef": {
                "_ref": "e9fad3cf-f71f-4169-b133-76721e76218e",
                "_type": "reference"
              },
              "name": "Bourbon"
            },
            {
              "_key": "vb0059",
              "_type": "variantIngredient",
              "amount": "25ml",
              "ingredientRef": {
                "_ref": "60de2b4a-4282-405d-8f00-74811ed36fdc",
                "_type": "reference"
              },
              "name": "Fresh Lemon Juice"
            }
          ],
          "instructions": [
            "Dry shake all ingredients",
            "Add ice and shake"
          ],
          "name": "Boston Sour",
          "note": "The name distinguishes the"
        },
        {
          "_key": "vb0066",
          "_type": "variant",
          "description": "The same sour built",
          "difficulty": "wayfinder",
          "ingredients": [
            {
              "_key": "vb0063",
              "_type": "variantIngredient",
              "amount": "60ml",
              "ingredientRef": {
                "_ref": "b86237c7-2bc0-455c-ac83-509494c443af",
                "_type": "reference"
              },
              "name": "Scotch"
            },
            {
              "_key": "vb0064",
              "_type": "variantIngredient",
              "amount": "25ml",
              "ingredientRef": {
                "_ref": "60de2b4a-4282-405d-8f00-74811ed36fdc",
                "_type": "reference"
              },
              "name": "Fresh Lemon Juice"
            }
          ],
          "instructions": [
            "Shake hard with ice.",
            "Strain into a rocks"
          ],
          "name": "Scotch Sour",
          "note": "An unpeated or lightly"
        }
      ]
    }
  ],
  "equipment": [
    {
      "_createdAt": "2025-09-12T12:37:57Z",
      "_id": "0f70f783-5479-4c52-a496-2a21de42a0fe",
      "_rev": "dW4Z71BF0adeqhCgUlHo5C",
      "_system": {
        "base": {
          "id": "0f70f783-5479-4c52-a496-2a21de42a0fe",
          "rev": "wjwIpQymvTQujB9MFY9zoE"
        }
      },
      "_type": "equipment",
      "_updatedAt": "2026-07-29T10:28:47Z",
      "budgetAlternative": "Stainless steel mugs (£5–8):",
      "careInstructions": [
        "Hand wash only with",
        "Dry immediately to prevent"
      ],
      "category": "glassware",
      "commonMistakes": [
        "Using unlined copper: unsafe",
        "Under-icing: defeats the chilling"
      ],
      "description": "Metal mug designed to",
      "essential": false,
      "faqs": [
        {
          "_key": "g20007",
          "answer": "Lined ones, yes. Bare",
          "question": "Are copper mugs safe"
        },
        {
          "_key": "g20008",
          "answer": "Half history, half physics.",
          "question": "Why are Moscow Mules"
        }
      ],
      "featured": true,
      "glassType": "mug-cup",
      "history": "The copper mug rose",
      "image": {
        "_type": "image",
        "asset": {
          "_ref": "image-7d7aa1bf00d286e39fad2c9b7f44087b6c02eac6-1024x1536-webp",
          "_type": "reference"
        }
      },
      "keywords": [
        "copper mug",
        "moscow mule mug"
      ],
      "lifespan": [
        "Premium mugs: 8–15 years",
        "Standard mugs: 4–7 years"
      ],
      "longDescription": [
        {
          "_key": "g20001",
          "_type": "block",
          "children": [
            {
              "_key": "g20002",
              "_type": "span",
              "marks": [],
              "text": "The copper mug is"
            }
          ],
          "markDefs": [],
          "style": "normal"
        },
        {
          "_key": "g20003",
          "_type": "block",
          "children": [
            {
              "_key": "g20004",
              "_type": "span",
              "marks": [],
              "text": "The lining is non-negotiable."
            }
          ],
          "markDefs": [],
          "style": "normal"
        }
      ],
      "metaDescription": "Why Moscow Mules come",
      "metaTitle": "Copper Mug Guide: the",
      "name": "Copper Mug",
      "premiumOption": "Cocktail Kingdom Copper Mule",
      "priceRange": {
        "budget": 7,
        "premium": 25
      },
      "professionalTip": "For a perfect Moscow",
      "relatedCocktails": [
        {
          "_key": "088c464c9844",
          "_ref": "fd8f88f6-dad1-4041-93b4-5c1fe31a95f1",
          "_type": "reference"
        }
      ],
      "relatedEquipment": [
        {
          "_key": "oc0003",
          "_ref": "7525f122-af2c-451f-aa6b-4cf85c36522d",
          "_type": "reference"
        },
        {
          "_key": "oc0004",
          "_ref": "e03fe14a-7571-43d8-8018-2b19029efd1c",
          "_type": "reference"
        }
      ],
      "slug": {
        "_type": "slug",
        "current": "copper-mug"
      },
      "specifications": {
        "capacity": "400–500ml",
        "details": "Straight-sided or slightly tapered",
        "material": "Copper or copper-plated stainless"
      },
      "tips": [
        "Always serve ice-cold: the",
        "Use plenty of ice"
      ],
      "usage": "Ginger beer–based cocktails and",
      "whatToLookFor": [
        "Food-safe interior lining: bare",
        "Thick walls: thin mugs"
      ]
    },
    {
      "_createdAt": "2025-09-12T13:33:39Z",
      "_id": "688c00f1-28ec-42a0-ba9c-fb43be1dcc22",
      "_rev": "gCgasY4sKdv6JJn01vQ7JI",
      "_system": {
        "base": {
          "id": "688c00f1-28ec-42a0-ba9c-fb43be1dcc22",
          "rev": "P6xC10hxR3XADdHZY9nS7J"
        }
      },
      "_type": "equipment",
      "_updatedAt": "2026-07-22T23:12:13Z",
      "budgetAlternative": "A sturdy pint glass",
      "careInstructions": [
        "Rinse immediately after use",
        "Wash by hand with"
      ],
      "category": "shaking",
      "commonMistakes": [
        "Using thin-walled glassware that",
        "Overfilling with ice, reducing"
      ],
      "description": "A heavy-walled glass vessel",
      "essential": false,
      "faqs": [
        {
          "_key": "g50017",
          "answer": "Spirit-only drinks have nothing",
          "question": "Why stir a cocktail"
        },
        {
          "_key": "g50018",
          "answer": "Twenty to thirty seconds",
          "question": "How long should you"
        }
      ],
      "featured": false,
      "history": "The mixing glass emerged",
      "image": {
        "_type": "image",
        "asset": {
          "_ref": "image-5d541e79f3f0a25fa4fff4bbd45082e754d2c8dc-1024x1536-webp",
          "_type": "reference"
        }
      },
      "keywords": [
        "mixing glass",
        "why stir a cocktail"
      ],
      "lifespan": [
        "Premium crystal: 10–15 years",
        "Standard glass: 5–10 years"
      ],
      "longDescription": [
        {
          "_key": "g50011",
          "_type": "block",
          "children": [
            {
              "_key": "g50012",
              "_type": "span",
              "marks": [],
              "text": "The mixing glass is"
            }
          ],
          "markDefs": [],
          "style": "normal"
        },
        {
          "_key": "g50013",
          "_type": "block",
          "children": [
            {
              "_key": "g50014",
              "_type": "span",
              "marks": [],
              "text": "Fill two-thirds with good"
            }
          ],
          "markDefs": [],
          "style": "normal"
        }
      ],
      "metaDescription": "Why stirred drinks are",
      "metaTitle": "Mixing Glass Guide: the",
      "name": "Mixing Glass",
      "premiumOption": "Heavy crystal mixing glasses",
      "priceRange": {
        "budget": 15,
        "premium": 45
      },
      "professionalTip": "If bubbles appear while",
      "relatedCocktails": [
        {
          "_key": "d8ee95e794d0",
          "_ref": "6474bb1b-e64c-4e51-92a8-812dc0674905",
          "_type": "reference"
        },
        {
          "_key": "c9b1b5e071ec",
          "_ref": "a9943a78-5180-46e6-b32c-ada3ad31fc91",
          "_type": "reference"
        }
      ],
      "relatedEquipment": [
        {
          "_key": "oc0028",
          "_ref": "equipment-martini-glass",
          "_type": "reference"
        },
        {
          "_key": "oc0029",
          "_ref": "d579fe49-b97e-462d-ae0e-75190b3849df",
          "_type": "reference"
        }
      ],
      "relatedGuides": [
        {
          "_key": "gl3",
          "_type": "guideLink",
          "guide": {
            "_ref": "6b951c33-98ba-45c1-8f53-86f153bf4674",
            "_type": "reference"
          },
          "linkText": "Core techniques: the Complete",
          "sectionAnchor": "Understanding the Core Techniques"
        }
      ],
      "slug": {
        "_type": "slug",
        "current": "mixing-glass"
      },
      "specifications": {
        "capacity": "Typically 500–700ml",
        "details": "Wide, stable base with",
        "material": "Glass or crystal"
      },
      "tips": [
        "Pre-chill the mixing glass",
        "Use large, solid ice"
      ],
      "usage": "Used for stirring cocktails",
      "whatToLookFor": [
        "Thick walls that retain",
        "A stable base that"
      ]
    }
  ],
  "ingredient": [
    {
      "_createdAt": "2026-01-04T12:22:46Z",
      "_id": "0db9e705-a190-4300-bb5a-ed1548367acf",
      "_rev": "Fey15WWDqPCVFXodWVwFMT",
      "_system": {
        "base": {
          "id": "0db9e705-a190-4300-bb5a-ed1548367acf",
          "rev": "P0ARo92oMMSuIIwmnDGtg3"
        }
      },
      "_type": "ingredient",
      "_updatedAt": "2026-08-05T20:40:30Z",
      "abv": "Typically 35–40%",
      "budgetImage": {
        "_type": "image",
        "asset": {
          "_ref": "image-d215ff3f53506729b9631d6faf8f59c5c17c1e06-433x1024-webp",
          "_type": "reference"
        }
      },
      "category": "spirits",
      "description": "A style of rum",
      "faqs": [
        {
          "_key": "i10028",
          "answer": "A rum base, molasses-derived",
          "question": "What is spiced rum"
        },
        {
          "_key": "i10029",
          "answer": "Dark rum takes its",
          "question": "What's the difference between"
        }
      ],
      "featured": false,
      "flavorProfile": {
        "primary": [
          "Spice",
          "Vanilla"
        ],
        "strength": "medium-bold",
        "tasting": "Warming and aromatic with"
      },
      "history": "Spiced rum evolved as",
      "image": {
        "_type": "image",
        "asset": {
          "_ref": "image-d215ff3f53506729b9631d6faf8f59c5c17c1e06-433x1024-webp",
          "_type": "reference"
        }
      },
      "keywords": [
        "spiced rum",
        "what is spiced rum"
      ],
      "longDescription": [
        {
          "_key": "i10019",
          "_type": "block",
          "children": [
            {
              "_key": "i10020",
              "_type": "span",
              "marks": [],
              "text": "Spiced rum is rum"
            }
          ],
          "markDefs": [],
          "style": "normal"
        },
        {
          "_key": "i10021",
          "_type": "block",
          "children": [
            {
              "_key": "i10022",
              "_type": "span",
              "marks": [],
              "text": "In drinks, mind the"
            }
          ],
          "markDefs": [],
          "style": "normal"
        }
      ],
      "metaDescription": "What spiced rum is,",
      "metaTitle": "Spiced Rum Guide: Choosing",
      "name": "Spiced Rum",
      "origin": "Caribbean (primarily)",
      "pairsWellWith": [
        "Citrus juices (lime, orange)",
        "Cola"
      ],
      "premiumImage": {
        "_type": "image",
        "asset": {
          "_ref": "image-0973955540037ef4a6857c14df00e2654ac564ed-1024x1536-webp",
          "_type": "reference"
        }
      },
      "priceRange": {
        "budget": 18.49,
        "premium": 40
      },
      "productionMethod": "Produced by infusing rum",
      "professionalTip": "Great spiced rum enhances",
      "recommendedBrands": {
        "budget": "Captain Morgan Original Spiced",
        "premium": "Jerry Can Spirits Expedition"
      },
      "relatedCocktails": [
        {
          "_key": "190dccd6664f",
          "_ref": "36df1abf-de1b-4ce4-881f-964d3e1b4e31",
          "_type": "reference"
        },
        {
          "_key": "1394c34ce52b",
          "_ref": "33784367-2f4e-4d2a-a176-f0f3bf609207",
          "_type": "reference"
        }
      ],
      "relatedEquipment": [
        {
          "_key": "i10032",
          "_ref": "b3968034-7651-400c-8421-1a95c90d18b2",
          "_type": "reference"
        },
        {
          "_key": "i10033",
          "_ref": "e03fe14a-7571-43d8-8018-2b19029efd1c",
          "_type": "reference"
        }
      ],
      "relatedGuides": [
        {
          "_key": "i10034",
          "_type": "guideLink",
          "guide": {
            "_ref": "b3d4e188-b8ac-4747-bda6-44084ff4cb5e",
            "_type": "reference"
          },
          "linkText": "Is Dark Rum the"
        },
        {
          "_key": "i10035",
          "_type": "guideLink",
          "guide": {
            "_ref": "5f94f6fd-26df-4c85-9526-6689cb112c54",
            "_type": "reference"
          },
          "linkText": "How to Read a"
        }
      ],
      "relatedIngredients": [
        {
          "_key": "il00003m",
          "_ref": "xR4wuYXdb13aPdIbBLlYJA",
          "_type": "reference"
        },
        {
          "_key": "il00003n",
          "_ref": "d6ced5af-8af8-4362-8b1e-f787ab8a2f14",
          "_type": "reference"
        }
      ],
      "seasonality": "Autumn / Winter",
      "shelfLife": "Indefinite when stored sealed",
      "slug": {
        "_type": "slug",
        "current": "spiced-rum"
      },
      "storage": "Store sealed at room",
      "substitutions": [
        "Dark rum with baking",
        "Gold rum with vanilla"
      ],
      "topTips": [
        "Spiced rums vary widely:",
        "Balance sweetness carefully, as"
      ],
      "usage": "Used as a base"
    },
    {
      "_createdAt": "2025-09-08T18:04:01Z",
      "_id": "80f9933a-ec1a-4a67-82d1-648487cf8ca7",
      "_rev": "v20c80PYNil1HmQKBr9XjK",
      "_system": {
        "base": {
          "id": "80f9933a-ec1a-4a67-82d1-648487cf8ca7",
          "rev": "dbdAGwZlInHeagMbZrJpHr"
        }
      },
      "_type": "ingredient",
      "_updatedAt": "2026-08-02T10:29:04Z",
      "abv": "40%",
      "author": "Jerry Can Spirits",
      "category": "spirits",
      "description": "A spiced rum built",
      "faqs": [
        {
          "_key": "i10010",
          "answer": "Madagascan vanilla arrives first,",
          "question": "What does Expedition Spiced"
        },
        {
          "_key": "i10011",
          "answer": "The Old Standard, our",
          "question": "What cocktails suit Expedition"
        }
      ],
      "featured": true,
      "flavorProfile": {
        "primary": [
          "Vanilla",
          "Cinnamon"
        ],
        "strength": "medium-bold",
        "tasting": "Madagascan vanilla arrives first,"
      },
      "history": "Jerry Can Spirits Expedition",
      "image": {
        "_type": "image",
        "asset": {
          "_ref": "image-d4b5d52eb3ebbff37e3e5d9d80588ce3fe30113b-1080x1620-webp",
          "_type": "reference"
        }
      },
      "keywords": [
        "expedition spiced rum",
        "jerry can spirits rum"
      ],
      "longDescription": [
        {
          "_key": "i10001",
          "_type": "block",
          "children": [
            {
              "_key": "i10002",
              "_type": "span",
              "marks": [],
              "text": "This is the house"
            }
          ],
          "markDefs": [],
          "style": "normal"
        },
        {
          "_key": "i10003",
          "_type": "block",
          "children": [
            {
              "_key": "i10004",
              "_type": "span",
              "marks": [],
              "text": "The named serves are"
            }
          ],
          "markDefs": [],
          "style": "normal"
        }
      ],
      "metaDescription": "How our spiced rum",
      "metaTitle": "Expedition Spiced Rum in",
      "name": "Jerry Can Spirits Expedition",
      "origin": "Caribbean rum, finished and",
      "productionMethod": "Caribbean rum base, macerated",
      "professionalTip": "This rum is built",
      "relatedCocktails": [
        {
          "_key": "9af4555077d6",
          "_ref": "deb741aa-cb9d-4285-8ed7-a549dae1db79",
          "_type": "reference"
        },
        {
          "_key": "4b787d84446f",
          "_ref": "5c03a375-ba99-4ea7-a992-c7a9674a5322",
          "_type": "reference"
        }
      ],
      "relatedEquipment": [
        {
          "_key": "i10014",
          "_ref": "b3968034-7651-400c-8421-1a95c90d18b2",
          "_type": "reference"
        },
        {
          "_key": "i10015",
          "_ref": "equipment-cobbler-shaker",
          "_type": "reference"
        }
      ],
      "relatedGuides": [
        {
          "_key": "i10017",
          "_type": "guideLink",
          "guide": {
            "_ref": "0df95f96-c2ec-444f-9e4d-4842aff49c49",
            "_type": "reference"
          },
          "linkText": "The Botanicals Behind Expedition"
        },
        {
          "_key": "i10018",
          "_type": "guideLink",
          "guide": {
            "_ref": "3d0ccbfd-9eb6-4f5b-bdca-22828becddef",
            "_type": "reference"
          },
          "linkText": "The Complete Guide to"
        }
      ],
      "relatedIngredients": [
        {
          "_key": "mf0333",
          "_ref": "0db9e705-a190-4300-bb5a-ed1548367acf",
          "_type": "reference"
        },
        {
          "_key": "mf0334",
          "_ref": "d6ced5af-8af8-4362-8b1e-f787ab8a2f14",
          "_type": "reference"
        }
      ],
      "rrp": 45,
      "seasonality": "Year-round",
      "shelfLife": "Indefinite when stored sealed",
      "slug": {
        "_type": "slug",
        "current": "jerry-can-spirits-expedition-spiced-rum"
      },
      "storage": "Store upright in a",
      "substitutions": [
        "Premium spiced rum (profile",
        "Dark rum with aromatic"
      ],
      "topTips": [
        "Serve at room temperature",
        "Chill slightly before mixing"
      ],
      "usage": "Used as a base"
    }
  ]
}
