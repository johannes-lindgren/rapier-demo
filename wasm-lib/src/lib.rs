use wasm_bindgen::prelude::*;
use contour_tracing::array::bits_to_paths;

#[wasm_bindgen]
extern {
    pub fn alert(s: &str);
}

#[wasm_bindgen]
pub struct World {
    path: String,
    holes: String,
    // holes: Vec<u32>,
}

#[wasm_bindgen]
impl World {
    #[wasm_bindgen(constructor)]
    pub fn new(path: String, holes: String) -> World {
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
    pub fn holes(&self) -> String {
        self.holes.clone()
    }

    #[wasm_bindgen(setter)]
    pub fn set_holes(&mut self, path: String) {
        self.holes = path;
    }
    // #[wasm_bindgen(getter)]
    // pub fn holes(&self) -> Vec<u32> {
    //     self.holes.clone()
    // }
    //
    // #[wasm_bindgen(setter)]
    // pub fn set_holes(&mut self, path: Vec<u32>) {
    //     self.holes = path;
    // }
}

// fn bit_map<F>(data: &[u8], chunk_size: usize, predicate: F) -> Vec<Vec<i8>> where F: FnOnce(&u8) -> i8 {
//     data
//         .iter()
//         .step_by(4)
//         .cloned()
//         .collect::<Vec<_>>()
//         // 4 colors
//         .chunks(chunk_size)
//         .map(|chunk| chunk
//             .iter()
//             .map(predicate)
//             .collect::<Vec<i8>>()
//         )
//         .collect::<Vec<Vec<i8>>>()
// }

#[wasm_bindgen]
pub fn greet(width: usize, height: usize, threshold_fill_float: f32, threshold_hole_float: f32, data: &[u8]) -> World {
    let threshold_fill = (threshold_fill_float * 255.0) as u8;
    let threshold_hole = (threshold_hole_float * 255.0) as u8;

    let terrain_predicate = |&b: &u8|
        if b >= threshold_fill {
            1i8
        } else {
            0i8
        };
    let holes_predicate = |&b: &u8|
        if b >= threshold_hole {
            0i8
        } else {
            1i8
        };

    let above_threshold: Vec<Vec<i8>> = data
        .iter()
        .step_by(4)
        .cloned()
        .collect::<Vec<_>>()
        // 4 colors
        .chunks(width)
        .map(|chunk| chunk
            .iter()
            .map(terrain_predicate)
            .collect()
        )
        .collect();

    let path = bits_to_paths(above_threshold.clone(), true);


    let below_threshold: Vec<Vec<i8>> = data
        .iter()
        .step_by(4)
        .cloned()
        .collect::<Vec<_>>()
        // 4 colors
        .chunks(width)
        .map(|chunk| chunk
            .iter()
            .map(holes_predicate)
            .collect()
        )
        .collect();

    let holes = bits_to_paths(below_threshold, true);

    // // Lower the resolution of the holes
    // let holeStep = 1;
    //
    // let holes = data
    //     .iter()
    //     .step_by(4)
    //     .cloned()
    //     .collect::<Vec<_>>()
    //     // 4 colors
    //     .chunks(width)
    //     .step_by(holeStep)
    //     .enumerate()
    //     .flat_map(|(row, &ref rows)|
    //         rows
    //             .iter()
    //             .step_by(holeStep)
    //             .enumerate()
    //             .filter_map(|(column, &b)|
    //                 if b < hole_threshold {
    //                     Some([
    //                         (column * holeStep) as u32,
    //                         (row * holeStep) as u32
    //                     ].to_vec())
    //                 } else {
    //                     None
    //                 })
    //             .flatten()
    //             .collect::<Vec<u32>>()
    //     )
    //     .collect::<Vec<u32>>();


    // let holes: Vec<u32> = bits
    //     .iter()
    //     .step_by(holeStep)
    //     .enumerate()
    //     .flat_map(|(column, &ref rows)|
    //         rows
    //             .iter()
    //             .step_by(holeStep)
    //             .enumerate()
    //             .filter_map(|(row, &b)|
    //                 if b == 0 {
    //                     Some([
    //                         (row * holeStep) as u32,
    //                         (column * holeStep) as u32
    //                     ].to_vec())
    //                 } else {
    //                     None
    //                 })
    //             .flatten()
    //             .collect::<Vec<u32>>()
    //     )
    //     .collect::<Vec<u32>>();

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
