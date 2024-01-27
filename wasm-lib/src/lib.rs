use wasm_bindgen::prelude::*;
use contour_tracing::array::bits_to_paths;

#[wasm_bindgen]
extern {
    pub fn alert(s: &str);
}

#[wasm_bindgen]
pub struct World {
    path: String,
    holes: Vec<u32>,
}

#[wasm_bindgen]
impl World {
    #[wasm_bindgen(constructor)]
    pub fn new(path: String, holes: Vec<u32>) -> World {
        World { path, holes }
    }

    #[wasm_bindgen(getter)]
    pub fn path(&self) -> String {
        self.path.clone()
    }

    #[wasm_bindgen(setter)]
    pub fn set_path(&mut self, path: String) {
        self.path = path;
    }

    #[wasm_bindgen(getter)]
    pub fn holes(&self) -> Vec<u32> {
        self.holes.clone()
    }

    #[wasm_bindgen(setter)]
    pub fn set_holes(&mut self, path: Vec<u32>) {
        self.holes = path;
    }
}

#[wasm_bindgen]
pub fn greet(width: usize, height: i32, data: &[u8]) -> World {
    let threshold = 128;
    let bits: Vec<Vec<i8>> = data
        .iter()
        .step_by(4)
        .cloned()
        .collect::<Vec<_>>()
        // 4 colors
        .chunks(width)
        .map(|chunk| chunk.iter().map(|&b| if b > threshold { 1i8 } else { 0i8 }).collect())
        .collect();

    // Lower the resolution of the holes
    let holeStep = 4;

    let holes: Vec<u32> = bits
        .iter()
        .step_by(holeStep)
        .enumerate()
        .flat_map(|(column, &ref rows)|
            rows
                .iter()
                .step_by(holeStep)
                .enumerate()
                .filter_map(|(row, &b)|
                    if b == 0 {
                        Some([
                            (row * holeStep) as u32,
                            (column * holeStep) as u32
                        ].to_vec())
                    } else {
                        None
                    })
                .flatten()
                .collect::<Vec<u32>>()
        )
        .collect::<Vec<u32>>();

    let path = bits_to_paths(bits, true);
    World {
        path,
        holes,
    }
}

// fn flatten_vec(vec_of_arrays: Vec<[i32; 2]>) -> Vec<i32> {
//     let mut flattened_vec = Vec::new();
//
//     for array in vec_of_arrays {
//         flattened_vec.push(array[0]);
//         flattened_vec.push(array[1]);
//     }
//
//     flattened_vec
// }
