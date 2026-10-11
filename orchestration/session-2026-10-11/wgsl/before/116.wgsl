// Three.js r186 - Node System

// global
diagnostic( off, derivative_uniformity );


// structs

struct OutputStruct {
	@location( 0 ) color: vec4<f32>
};
var<private> output : OutputStruct;

// uniforms
@binding( 0 ) @group( 1 ) var nodeUniform3_sampler : sampler;
@binding( 1 ) @group( 1 ) var nodeUniform3 : texture_2d<f32>;
@binding( 3 ) @group( 1 ) var nodeUniform19_sampler : sampler;
@binding( 4 ) @group( 1 ) var nodeUniform19 : texture_2d<f32>;
@binding( 5 ) @group( 1 ) var nodeUniform32_sampler : sampler_comparison;
@binding( 6 ) @group( 1 ) var nodeUniform32 : texture_depth_2d;

struct objectStruct {
	nodeUniform0 : mat4x4<f32>,
	nodeUniform2 : mat4x4<f32>,
	nodeUniform4 : mat3x3<f32>,
	nodeUniform5 : f32,
	nodeUniform6 : mat4x4<f32>,
	nodeUniform7 : f32,
	nodeUniform8 : f32,
	nodeUniform9 : f32,
	nodeUniform11 : mat3x3<f32>,
	nodeUniform12 : f32,
	nodeUniform13 : vec3<f32>,
	nodeUniform16 : vec3<f32>,
	nodeUniform17 : vec3<f32>,
	nodeUniform18 : f32,
	nodeUniform40 : vec3<f32>,
	nodeUniform41 : vec3<f32>,
	nodeUniform42 : vec3<f32>,
	nodeUniform43 : f32
};
@binding( 2 ) @group( 1 )
var<uniform> object : objectStruct;

struct renderStruct {
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>,
	nodeUniform21 : vec3<f32>,
	nodeUniform22 : vec3<f32>,
	nodeUniform20 : vec3<f32>,
	nodeUniform25 : vec3<f32>,
	nodeUniform28 : vec3<f32>,
	nodeUniform37 : vec3<f32>,
	nodeUniform38 : f32,
	nodeUniform39 : f32,
	nodeUniform23 : vec3<f32>,
	nodeUniform24 : vec3<f32>,
	nodeUniform26 : vec3<f32>,
	nodeUniform27 : vec3<f32>,
	nodeUniform36 : vec3<f32>,
	nodeUniform29 : mat4x4<f32>,
	nodeUniform30 : f32,
	nodeUniform31 : f32,
	nodeUniform35 : f32,
	cameraPosition : vec3<f32>,
	nodeUniform33 : f32,
	nodeUniform34 : vec2<f32>
};
@binding( 0 ) @group( 0 )
var<uniform> render : renderStruct;

// vars
var<private> DiffuseColor : vec4<f32>;
var<private> nodeVar1 : vec4<f32>;
var<private> nodeVar2 : f32;
var<private> nodeVar3 : f32;
var<private> nodeVar4 : f32;
var<private> nodeVar5 : f32;
var<private> nodeVar6 : f32;
var<private> nodeVar7 : vec3<f32>;
var<private> nodeVar8 : f32;
var<private> Metalness : f32;
var<private> Roughness : f32;
var<private> normalViewGeometry : vec3<f32>;
var<private> nodeVar9 : vec3<f32>;
var<private> SpecularColor : vec3<f32>;
var<private> SpecularColorBlended : vec3<f32>;
var<private> SpecularF90 : f32;
var<private> DiffuseContribution : vec3<f32>;
var<private> EmissiveColor : vec3<f32>;
var<private> nodeVar10 : f32;
var<private> NORMAL_normalView : vec3<f32>;
var<private> normalView : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> nodeVar11 : vec3<f32>;
var<private> nodeVar12 : vec3<f32>;
var<private> nodeVar13 : f32;
var<private> nodeVar14 : f32;
var<private> nodeVar15 : f32;
var<private> Output : vec4<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar16 : f32;
var<private> nodeVar17 : vec2<f32>;
var<private> nodeVar18 : f32;
var<private> nodeVar19 : f32;
var<private> nodeVar20 : f32;
var<private> nodeVar21 : f32;
var<private> nodeVar22 : vec3<f32>;
var<private> nodeVar23 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> nodeVar24 : f32;
var<private> nodeVar25 : f32;
var<private> nodeVar26 : f32;
var<private> nodeVar27 : vec3<f32>;
var<private> nodeVar28 : vec3<f32>;
var<private> nodeVar29 : vec3<f32>;
var<private> nodeVar30 : vec4<f32>;
var<private> nodeVar31 : vec4<f32>;
var<private> nodeVar32 : vec3<f32>;
var<private> nodeVar33 : vec3<f32>;
var<private> nodeVar34 : f32;
var<private> nodeVar35 : vec3<f32>;
var<private> nodeVar36 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar37 : vec3<f32>;
var<private> nodeVar38 : vec3<f32>;
var<private> nodeVar39 : vec3<f32>;
var<private> nodeVar40 : vec3<f32>;
var<private> nodeVar41 : f32;
var<private> nodeVar42 : f32;
var<private> nodeVar43 : f32;
var<private> nodeVar44 : vec3<f32>;
var<private> nodeVar45 : vec3<f32>;
var<private> nodeVar46 : vec3<f32>;
var<private> nodeVar47 : vec3<f32>;
var<private> nodeVar48 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar49 : vec3<f32>;
var<private> nodeVar50 : f32;
var<private> nodeVar51 : f32;
var<private> nodeVar52 : f32;
var<private> nodeVar53 : vec3<f32>;
var<private> nodeVar54 : vec3<f32>;
var<private> nodeVar55 : vec3<f32>;
var<private> nodeVar56 : vec3<f32>;
var<private> nodeVar57 : vec3<f32>;
var<private> nodeVar58 : vec4<f32>;
var<private> nodeVar59 : vec4<f32>;
var<private> nodeVar60 : vec3<f32>;
var<private> nodeVar61 : vec3<f32>;
var<private> nodeVar62 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar63 : f32;
var<private> nodeVar64 : vec4<f32>;
var<private> nodeVar65 : vec3<f32>;
var<private> nodeVar66 : vec3<f32>;
var<private> nodeVar67 : f32;
var<private> nodeVar68 : f32;
var<private> nodeVar69 : vec2<f32>;
var<private> nodeVar70 : f32;
var<private> nodeVar71 : vec2<f32>;
var<private> nodeVar72 : f32;
var<private> nodeVar73 : vec2<f32>;
var<private> nodeVar74 : f32;
var<private> nodeVar75 : vec2<f32>;
var<private> nodeVar76 : f32;
var<private> nodeVar77 : vec2<f32>;
var<private> nodeVar78 : f32;
var<private> nodeVar79 : f32;
var<private> nodeVar80 : vec3<f32>;
var<private> nodeVar81 : vec3<f32>;
var<private> nodeVar82 : vec3<f32>;
var<private> nodeVar83 : vec3<f32>;
var<private> nodeVar84 : vec3<f32>;
var<private> nodeVar85 : vec3<f32>;
var<private> nodeVar86 : f32;
var<private> nodeVar87 : f32;
var<private> nodeVar88 : f32;
var<private> nodeVar89 : vec3<f32>;
var<private> nodeVar90 : vec3<f32>;
var<private> nodeVar91 : vec3<f32>;
var<private> nodeVar92 : vec3<f32>;
var<private> nodeVar93 : vec3<f32>;
var<private> nodeVar94 : vec3<f32>;
var<private> nodeVar95 : f32;
var<private> nodeVar96 : f32;
var<private> nodeVar97 : f32;
var<private> nodeVar98 : vec3<f32>;
var<private> nodeVar99 : vec3<f32>;
var<private> nodeVar100 : vec3<f32>;
var<private> nodeVar101 : vec3<f32>;
var<private> nodeVar102 : vec3<f32>;
var<private> nodeVar103 : vec3<f32>;
var<private> nodeVar104 : f32;
var<private> nodeVar105 : f32;
var<private> nodeVar106 : f32;
var<private> nodeVar107 : f32;
var<private> nodeVar108 : f32;
var<private> nodeVar109 : vec3<f32>;
var<private> nodeVar110 : vec3<f32>;
var<private> nodeVar111 : vec3<f32>;
var<private> nodeVar112 : vec3<f32>;
var<private> nodeVar113 : vec3<f32>;
var<private> nodeVar114 : vec3<f32>;
var<private> nodeVar115 : vec3<f32>;
var<private> nodeVar116 : f32;
var<private> nodeVar117 : f32;
var<private> nodeVar118 : f32;
var<private> nodeVar119 : vec3<f32>;
var<private> nodeVar120 : vec3<f32>;
var<private> nodeVar121 : vec3<f32>;
var<private> nodeVar122 : vec3<f32>;
var<private> nodeVar123 : vec3<f32>;
var<private> nodeVar124 : vec3<f32>;
var<private> nodeVar125 : f32;
var<private> nodeVar126 : f32;
var<private> nodeVar127 : f32;
var<private> nodeVar128 : vec3<f32>;
var<private> nodeVar129 : vec3<f32>;
var<private> nodeVar130 : vec3<f32>;
var<private> nodeVar131 : vec3<f32>;
var<private> nodeVar132 : vec3<f32>;
var<private> nodeVar133 : vec3<f32>;
var<private> nodeVar134 : vec3<f32>;
var<private> nodeVar135 : f32;
var<private> nodeVar136 : vec3<f32>;
var<private> nodeVar137 : vec3<f32>;
var<private> nodeVar138 : vec3<f32>;
var<private> nodeVar139 : vec3<f32>;
var<private> nodeVar140 : vec3<f32>;
var<private> nodeVar141 : vec3<f32>;
var<private> nodeVar142 : vec3<f32>;
var<private> nodeVar143 : f32;
var<private> nodeVar144 : f32;
var<private> nodeVar145 : f32;
var<private> nodeVar146 : vec3<f32>;
var<private> nodeVar147 : vec3<f32>;
var<private> nodeVar148 : vec3<f32>;
var<private> nodeVar149 : vec3<f32>;
var<private> nodeVar150 : vec3<f32>;
var<private> nodeVar151 : vec3<f32>;
var<private> nodeVar152 : vec3<f32>;
var<private> nodeVar153 : vec3<f32>;
var<private> nodeVar154 : vec3<f32>;
var<private> nodeVar155 : vec3<f32>;
var<private> nodeVar156 : vec3<f32>;
var<private> nodeVar157 : vec3<f32>;
var<private> nodeVar158 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar159 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar160 : vec3<f32>;
var<private> nodeVar161 : f32;
var<private> nodeVar162 : vec3<f32>;
var<private> nodeVar163 : vec3<f32>;
var<private> nodeVar164 : vec3<f32>;
var<private> nodeVar165 : vec3<f32>;
var<private> nodeVar166 : vec3<f32>;
var<private> nodeVar167 : vec3<f32>;
var<private> nodeVar168 : vec3<f32>;
var<private> nodeVar169 : f32;
var<private> nodeVar170 : f32;
var<private> nodeVar171 : f32;
var<private> nodeVar172 : vec3<f32>;
var<private> nodeVar173 : vec3<f32>;
var<private> nodeVar174 : vec3<f32>;
var<private> nodeVar175 : vec3<f32>;
var<private> nodeVar176 : vec3<f32>;
var<private> nodeVar177 : vec3<f32>;
var<private> nodeVar178 : vec3<f32>;
var<private> nodeVar179 : f32;
var<private> nodeVar180 : vec3<f32>;
var<private> nodeVar181 : vec3<f32>;
var<private> nodeVar182 : vec3<f32>;
var<private> nodeVar183 : vec3<f32>;
var<private> nodeVar184 : vec3<f32>;
var<private> nodeVar185 : vec3<f32>;
var<private> nodeVar186 : vec3<f32>;
var<private> nodeVar187 : f32;
var<private> nodeVar188 : f32;
var<private> nodeVar189 : f32;
var<private> nodeVar190 : vec3<f32>;
var<private> nodeVar191 : vec3<f32>;
var<private> nodeVar192 : vec3<f32>;
var<private> nodeVar193 : vec3<f32>;
var<private> nodeVar194 : vec3<f32>;
var<private> nodeVar195 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar196 : vec3<f32>;
var<private> nodeVar197 : vec3<f32>;
var<private> nodeVar198 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar199 : vec3<f32>;
var<private> nodeVar200 : vec3<f32>;
var<private> nodeVar201 : vec3<f32>;
var<private> nodeVar202 : vec3<f32>;
var<private> nodeVar203 : vec3<f32>;
var<private> nodeVar204 : vec3<f32>;
var<private> nodeVar205 : vec3<f32>;
var<private> nodeVar206 : vec3<f32>;
var<private> nodeVar207 : vec3<f32>;
var<private> nodeVar208 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar209 : vec3<f32>;
var<private> nodeVar210 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar211 : vec3<f32>;
var<private> nodeVar212 : f32;
var<private> nodeVar213 : f32;
var<private> nodeVar214 : f32;
var<private> nodeVar215 : f32;
var<private> nodeVar216 : f32;
var<private> nodeVar217 : f32;
var<private> nodeVar218 : f32;
var<private> nodeVar219 : f32;
var<private> nodeVar220 : f32;
var<private> nodeVar221 : f32;
var<private> nodeVar222 : f32;
var<private> nodeVar223 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar224 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar225 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar226 : vec3<f32>;
var<private> nodeVar227 : f32;
var<private> nodeVar228 : vec4<f32>;

// codes
fn mx_floor ( x : f32 ) -> i32 {

	var nodeVar0 : f32;

	nodeVar0 = x;

	return i32( floor( nodeVar0 ) );

}


fn mx_fade ( t : f32 ) -> f32 {

	var nodeVar0 : f32;

	nodeVar0 = t;

	return ( ( ( nodeVar0 * nodeVar0 ) * nodeVar0 ) * ( ( nodeVar0 * ( ( nodeVar0 * 6.0 ) - 15.0 ) ) + 10.0 ) );

}


fn mx_rotl32 ( x : u32, k : i32 ) -> u32 {

	var nodeVar0 : i32;
	var nodeVar1 : u32;

	nodeVar0 = k;
	nodeVar1 = x;

	return ( ( nodeVar1 << u32( nodeVar0 ) ) | ( nodeVar1 >> u32( ( 32 - nodeVar0 ) ) ) );

}


fn mx_bjfinal ( a : u32, b : u32, c : u32 ) -> u32 {

	var nodeVar0 : u32;
	var nodeVar1 : u32;
	var nodeVar2 : u32;

	nodeVar0 = c;
	nodeVar1 = b;
	nodeVar2 = a;
	nodeVar0 = ( nodeVar0 ^ nodeVar1 );
	nodeVar0 = ( nodeVar0 - mx_rotl32( nodeVar1, 14 ) );
	nodeVar2 = ( nodeVar2 ^ nodeVar0 );
	nodeVar2 = ( nodeVar2 - mx_rotl32( nodeVar0, 11 ) );
	nodeVar1 = ( nodeVar1 ^ nodeVar2 );
	nodeVar1 = ( nodeVar1 - mx_rotl32( nodeVar2, 25 ) );
	nodeVar0 = ( nodeVar0 ^ nodeVar1 );
	nodeVar0 = ( nodeVar0 - mx_rotl32( nodeVar1, 16 ) );
	nodeVar2 = ( nodeVar2 ^ nodeVar0 );
	nodeVar2 = ( nodeVar2 - mx_rotl32( nodeVar0, 4 ) );
	nodeVar1 = ( nodeVar1 ^ nodeVar2 );
	nodeVar1 = ( nodeVar1 - mx_rotl32( nodeVar2, 14 ) );
	nodeVar0 = ( nodeVar0 ^ nodeVar1 );
	nodeVar0 = ( nodeVar0 - mx_rotl32( nodeVar1, 24 ) );

	return nodeVar0;

}


fn mx_hash_int_1 ( x : i32, y : i32 ) -> u32 {

	var nodeVar0 : i32;
	var nodeVar1 : i32;
	var nodeVar2 : u32;
	var nodeVar3 : u32;
	var nodeVar4 : u32;
	var nodeVar5 : u32;

	nodeVar0 = y;
	nodeVar1 = x;
	nodeVar2 = 2u;
	nodeVar3 = 0u;
	nodeVar4 = 0u;
	nodeVar5 = 0u;
	nodeVar5 = ( ( 3735928559u + ( nodeVar2 << 2u ) ) + 13u );
	nodeVar4 = nodeVar5;
	nodeVar3 = nodeVar4;
	nodeVar3 = ( nodeVar3 + u32( nodeVar1 ) );
	nodeVar4 = ( nodeVar4 + u32( nodeVar0 ) );

	return mx_bjfinal( nodeVar3, nodeVar4, nodeVar5 );

}


fn mx_select ( b : bool, t : f32, f : f32 ) -> f32 {

	var nodeVar0 : f32;
	var nodeVar1 : f32;
	var nodeVar2 : bool;
	var nodeVar3 : f32;

	nodeVar0 = f;
	nodeVar1 = t;
	nodeVar2 = b;

	return select( nodeVar0, nodeVar1, nodeVar2 );

}


fn mx_negate_if ( val : f32, b : bool ) -> f32 {

	var nodeVar0 : bool;
	var nodeVar1 : f32;
	var nodeVar2 : f32;

	nodeVar0 = b;
	nodeVar1 = val;

	return select( nodeVar1, ( - nodeVar1 ), nodeVar0 );

}


fn mx_gradient_float_0 ( hash : u32, x : f32, y : f32 ) -> f32 {

	var nodeVar0 : f32;
	var nodeVar1 : f32;
	var nodeVar2 : u32;
	var nodeVar3 : u32;
	var nodeVar4 : f32;
	var nodeVar5 : f32;

	nodeVar0 = y;
	nodeVar1 = x;
	nodeVar2 = hash;
	nodeVar3 = ( nodeVar2 & 7u );
	nodeVar4 = mx_select( ( nodeVar3 < 4u ), nodeVar1, nodeVar0 );
	nodeVar5 = ( 2.0 * mx_select( ( nodeVar3 < 4u ), nodeVar0, nodeVar1 ) );

	return ( mx_negate_if( nodeVar4, bool( ( nodeVar3 & 1u ) ) ) + mx_negate_if( nodeVar5, bool( ( nodeVar3 & 2u ) ) ) );

}


fn mx_bilerp_0 ( v0 : f32, v1 : f32, v2 : f32, v3 : f32, s : f32, t : f32 ) -> f32 {

	var nodeVar0 : f32;
	var nodeVar1 : f32;
	var nodeVar2 : f32;
	var nodeVar3 : f32;
	var nodeVar4 : f32;
	var nodeVar5 : f32;
	var nodeVar6 : f32;

	nodeVar0 = t;
	nodeVar1 = s;
	nodeVar2 = v3;
	nodeVar3 = v2;
	nodeVar4 = v1;
	nodeVar5 = v0;
	nodeVar6 = ( 1.0 - nodeVar1 );

	return ( ( ( 1.0 - nodeVar0 ) * ( ( nodeVar5 * nodeVar6 ) + ( nodeVar4 * nodeVar1 ) ) ) + ( nodeVar0 * ( ( nodeVar3 * nodeVar6 ) + ( nodeVar2 * nodeVar1 ) ) ) );

}


fn mx_gradient_scale2d_0 ( v : f32 ) -> f32 {

	var nodeVar0 : f32;

	nodeVar0 = v;

	return ( 0.6616 * nodeVar0 );

}


fn mx_perlin_noise_float_0 ( p : vec2<f32> ) -> f32 {

	var nodeVar0 : vec2<f32>;
	var nodeVar1 : i32;
	var nodeVar2 : i32;
	var nodeVar3 : f32;
	var nodeVar4 : f32;
	var nodeVar5 : f32;
	var nodeVar6 : f32;
	var nodeVar7 : f32;
	var nodeVar8 : f32;
	var nodeVar9 : f32;

	nodeVar0 = p;
	nodeVar1 = 0;
	nodeVar2 = 0;
	nodeVar3 = nodeVar0.x;
	nodeVar1 = mx_floor( nodeVar3 );
	nodeVar4 = ( nodeVar3 - f32( nodeVar1 ) );
	nodeVar5 = nodeVar0.y;
	nodeVar2 = mx_floor( nodeVar5 );
	nodeVar6 = ( nodeVar5 - f32( nodeVar2 ) );
	nodeVar7 = mx_fade( nodeVar4 );
	nodeVar8 = mx_fade( nodeVar6 );
	nodeVar9 = mx_bilerp_0( mx_gradient_float_0( mx_hash_int_1( nodeVar1, nodeVar2 ), nodeVar4, nodeVar6 ), mx_gradient_float_0( mx_hash_int_1( ( nodeVar1 + 1 ), nodeVar2 ), ( nodeVar4 - 1.0 ), nodeVar6 ), mx_gradient_float_0( mx_hash_int_1( nodeVar1, ( nodeVar2 + 1 ) ), nodeVar4, ( nodeVar6 - 1.0 ) ), mx_gradient_float_0( mx_hash_int_1( ( nodeVar1 + 1 ), ( nodeVar2 + 1 ) ), ( nodeVar4 - 1.0 ), ( nodeVar6 - 1.0 ) ), nodeVar7, nodeVar8 );

	return mx_gradient_scale2d_0( nodeVar9 );

}


fn mx_hash_int_2 ( x : i32, y : i32, z : i32 ) -> u32 {

	var nodeVar0 : i32;
	var nodeVar1 : i32;
	var nodeVar2 : i32;
	var nodeVar3 : u32;
	var nodeVar4 : u32;
	var nodeVar5 : u32;
	var nodeVar6 : u32;

	nodeVar0 = z;
	nodeVar1 = y;
	nodeVar2 = x;
	nodeVar3 = 3u;
	nodeVar4 = 0u;
	nodeVar5 = 0u;
	nodeVar6 = 0u;
	nodeVar6 = ( ( 3735928559u + ( nodeVar3 << 2u ) ) + 13u );
	nodeVar5 = nodeVar6;
	nodeVar4 = nodeVar5;
	nodeVar4 = ( nodeVar4 + u32( nodeVar2 ) );
	nodeVar5 = ( nodeVar5 + u32( nodeVar1 ) );
	nodeVar6 = ( nodeVar6 + u32( nodeVar0 ) );

	return mx_bjfinal( nodeVar4, nodeVar5, nodeVar6 );

}


fn mx_gradient_float_1 ( hash : u32, x : f32, y : f32, z : f32 ) -> f32 {

	var nodeVar0 : f32;
	var nodeVar1 : f32;
	var nodeVar2 : f32;
	var nodeVar3 : u32;
	var nodeVar4 : u32;
	var nodeVar5 : f32;
	var nodeVar6 : f32;

	nodeVar0 = z;
	nodeVar1 = y;
	nodeVar2 = x;
	nodeVar3 = hash;
	nodeVar4 = ( nodeVar3 & 15u );
	nodeVar5 = mx_select( ( nodeVar4 < 8u ), nodeVar2, nodeVar1 );
	nodeVar6 = mx_select( ( nodeVar4 < 4u ), nodeVar1, mx_select( ( ( nodeVar4 == 12u ) || ( nodeVar4 == 14u ) ), nodeVar2, nodeVar0 ) );

	return ( mx_negate_if( nodeVar5, bool( ( nodeVar4 & 1u ) ) ) + mx_negate_if( nodeVar6, bool( ( nodeVar4 & 2u ) ) ) );

}


fn mx_trilerp_0 ( v0 : f32, v1 : f32, v2 : f32, v3 : f32, v4 : f32, v5 : f32, v6 : f32, v7 : f32, s : f32, t : f32, r : f32 ) -> f32 {

	var nodeVar0 : f32;
	var nodeVar1 : f32;
	var nodeVar2 : f32;
	var nodeVar3 : f32;
	var nodeVar4 : f32;
	var nodeVar5 : f32;
	var nodeVar6 : f32;
	var nodeVar7 : f32;
	var nodeVar8 : f32;
	var nodeVar9 : f32;
	var nodeVar10 : f32;
	var nodeVar11 : f32;
	var nodeVar12 : f32;
	var nodeVar13 : f32;

	nodeVar0 = r;
	nodeVar1 = t;
	nodeVar2 = s;
	nodeVar3 = v7;
	nodeVar4 = v6;
	nodeVar5 = v5;
	nodeVar6 = v4;
	nodeVar7 = v3;
	nodeVar8 = v2;
	nodeVar9 = v1;
	nodeVar10 = v0;
	nodeVar11 = ( 1.0 - nodeVar2 );
	nodeVar12 = ( 1.0 - nodeVar1 );
	nodeVar13 = ( 1.0 - nodeVar0 );

	return ( ( nodeVar13 * ( ( nodeVar12 * ( ( nodeVar10 * nodeVar11 ) + ( nodeVar9 * nodeVar2 ) ) ) + ( nodeVar1 * ( ( nodeVar8 * nodeVar11 ) + ( nodeVar7 * nodeVar2 ) ) ) ) ) + ( nodeVar0 * ( ( nodeVar12 * ( ( nodeVar6 * nodeVar11 ) + ( nodeVar5 * nodeVar2 ) ) ) + ( nodeVar1 * ( ( nodeVar4 * nodeVar11 ) + ( nodeVar3 * nodeVar2 ) ) ) ) ) );

}


fn mx_gradient_scale3d_0 ( v : f32 ) -> f32 {

	var nodeVar0 : f32;

	nodeVar0 = v;

	return ( 0.982 * nodeVar0 );

}


fn mx_perlin_noise_float_1 ( p : vec3<f32> ) -> f32 {

	var nodeVar0 : vec3<f32>;
	var nodeVar1 : i32;
	var nodeVar2 : i32;
	var nodeVar3 : i32;
	var nodeVar4 : f32;
	var nodeVar5 : f32;
	var nodeVar6 : f32;
	var nodeVar7 : f32;
	var nodeVar8 : f32;
	var nodeVar9 : f32;
	var nodeVar10 : f32;
	var nodeVar11 : f32;
	var nodeVar12 : f32;
	var nodeVar13 : f32;

	nodeVar0 = p;
	nodeVar1 = 0;
	nodeVar2 = 0;
	nodeVar3 = 0;
	nodeVar4 = nodeVar0.x;
	nodeVar1 = mx_floor( nodeVar4 );
	nodeVar5 = ( nodeVar4 - f32( nodeVar1 ) );
	nodeVar6 = nodeVar0.y;
	nodeVar2 = mx_floor( nodeVar6 );
	nodeVar7 = ( nodeVar6 - f32( nodeVar2 ) );
	nodeVar8 = nodeVar0.z;
	nodeVar3 = mx_floor( nodeVar8 );
	nodeVar9 = ( nodeVar8 - f32( nodeVar3 ) );
	nodeVar10 = mx_fade( nodeVar5 );
	nodeVar11 = mx_fade( nodeVar7 );
	nodeVar12 = mx_fade( nodeVar9 );
	nodeVar13 = mx_trilerp_0( mx_gradient_float_1( mx_hash_int_2( nodeVar1, nodeVar2, nodeVar3 ), nodeVar5, nodeVar7, nodeVar9 ), mx_gradient_float_1( mx_hash_int_2( ( nodeVar1 + 1 ), nodeVar2, nodeVar3 ), ( nodeVar5 - 1.0 ), nodeVar7, nodeVar9 ), mx_gradient_float_1( mx_hash_int_2( nodeVar1, ( nodeVar2 + 1 ), nodeVar3 ), nodeVar5, ( nodeVar7 - 1.0 ), nodeVar9 ), mx_gradient_float_1( mx_hash_int_2( ( nodeVar1 + 1 ), ( nodeVar2 + 1 ), nodeVar3 ), ( nodeVar5 - 1.0 ), ( nodeVar7 - 1.0 ), nodeVar9 ), mx_gradient_float_1( mx_hash_int_2( nodeVar1, nodeVar2, ( nodeVar3 + 1 ) ), nodeVar5, nodeVar7, ( nodeVar9 - 1.0 ) ), mx_gradient_float_1( mx_hash_int_2( ( nodeVar1 + 1 ), nodeVar2, ( nodeVar3 + 1 ) ), ( nodeVar5 - 1.0 ), nodeVar7, ( nodeVar9 - 1.0 ) ), mx_gradient_float_1( mx_hash_int_2( nodeVar1, ( nodeVar2 + 1 ), ( nodeVar3 + 1 ) ), nodeVar5, ( nodeVar7 - 1.0 ), ( nodeVar9 - 1.0 ) ), mx_gradient_float_1( mx_hash_int_2( ( nodeVar1 + 1 ), ( nodeVar2 + 1 ), ( nodeVar3 + 1 ) ), ( nodeVar5 - 1.0 ), ( nodeVar7 - 1.0 ), ( nodeVar9 - 1.0 ) ), nodeVar10, nodeVar11, nodeVar12 );

	return mx_gradient_scale3d_0( nodeVar13 );

}


fn V_GGX_SmithCorrelated ( alpha : f32, dotNL : f32, dotNV : f32 ) -> f32 {

	var nodeVar0 : f32;

	nodeVar0 = ( alpha * alpha );

	return ( 0.5 / max( ( ( dotNL * sqrt( ( nodeVar0 + ( ( 1.0 - nodeVar0 ) * ( dotNV * dotNV ) ) ) ) ) + ( dotNV * sqrt( ( nodeVar0 + ( ( 1.0 - nodeVar0 ) * ( dotNL * dotNL ) ) ) ) ) ), 0.000001 ) );

}


fn D_GGX ( alpha : f32, dotNH : f32 ) -> f32 {

	var nodeVar0 : f32;
	var nodeVar1 : f32;

	nodeVar0 = ( alpha * alpha );
	nodeVar1 = ( 1.0 - ( ( dotNH * dotNH ) * ( 1.0 - nodeVar0 ) ) );

	return ( ( nodeVar0 / ( nodeVar1 * nodeVar1 ) ) * 0.3183098861837907 );

}


fn interleavedGradientNoise ( position : vec2<f32> ) -> f32 {

	


	return fract( ( 52.9829189 * fract( dot( position, vec2<f32>( 0.06711056, 0.00583715 ) ) ) ) );

}


fn vogelDiskSample ( sampleIndex : i32, samplesCount : i32, phi : f32 ) -> vec2<f32> {

	var nodeVar0 : f32;

	nodeVar0 = ( ( f32( sampleIndex ) * 2.399963229728653 ) + phi );

	return ( vec2<f32>( cos( nodeVar0 ), sin( nodeVar0 ) ) * vec2<f32>( sqrt( ( ( f32( sampleIndex ) + 0.5 ) / f32( samplesCount ) ) ) ) );

}




@fragment
fn main( @location( 0 ) v_positionView : vec3<f32>,
	@location( 1 ) v_positionWorld : vec3<f32>,
	@location( 2 ) v_normalViewGeometry : vec3<f32>,
	@location( 3 ) v_positionViewDirection : vec3<f32>,
	@location( 4 ) nodeVarying7 : vec2<f32>,
	@builtin( position ) fragCoord : vec4<f32> ) -> OutputStruct {

	// flow
	// code

	nodeVar1 = textureSample( nodeUniform3, nodeUniform3_sampler, ( object.nodeUniform4 * vec3<f32>( nodeVarying7, 1.0 ) ).xy );
	nodeVar2 = dot( ( nodeVar1.xyz * vec3<f32>( 1.0, 1.0, 1.0 ) ), vec3<f32>( 0.2126, 0.7152, 0.0722 ) );
	nodeVar3 = mix( -0.11, 1.01, object.nodeUniform5 );
	nodeVar4 = clamp( ( ( ( ( mx_perlin_noise_float_1( ( v_positionWorld * vec3<f32>( 4.2 ) ) ) * 1.0 ) + 0.0 ) * 0.9 ) + 0.5 ), 0.0, 1.0 );
	nodeVar5 = ( 1.0 - smoothstep( nodeVar3, ( nodeVar3 + 0.1 ), nodeVar4 ) );
	nodeVar6 = ( nodeVar5 * nodeVar5 );
	nodeVar7 = mix( ( mix( ( ( vec3<f32>( 0.14412847084818123, 0.11443537381770343, 0.09758734713304495 ) * vec3<f32>( ( ( nodeVar2 * 1.6 ) + 0.45 ) ) ) * vec3<f32>( 3.4 ) ), ( ( vec3<f32>( 0.04518620437910499, 0.04231141061442144, 0.04817182422013895 ) * vec3<f32>( ( nodeVar2 + 0.4 ) ) ) * vec3<f32>( 3.4 ) ), ( smoothstep( -0.35, 0.6, ( ( mx_perlin_noise_float_0( ( nodeVarying7 * vec2<f32>( 22.0 ) ) ) * 1.0 ) + 0.0 ) ) * 0.5 ) ) * vec3<f32>( ( 1.0 - ( clamp( ( ( 0.0 + ( 1.0 - smoothstep( 0.014000000000000002, 0.04000000000000001, length( ( nodeVarying7 - vec2<f32>( 0.139, 0.252 ) ) ) ) ) ) + ( 1.0 - smoothstep( 0.014000000000000002, 0.04000000000000001, length( ( nodeVarying7 - vec2<f32>( 0.231, 0.252 ) ) ) ) ) ), 0.0, 1.0 ) * 0.7 ) ) ) ), vec3<f32>( 0.007499032040460618, 0.005605391621829108, 0.004776953478513362 ), ( nodeVar6 * 0.9 ) );
	DiffuseColor = vec4<f32>( nodeVar7, 1.0 );

	if ( ( nodeVar4 > nodeVar3 ) ) {

		nodeVar8 = 1.0;

	} else {

		nodeVar8 = 0.0;

	}

	DiffuseColor.w = ( DiffuseColor.w * nodeVar8 );

	if ( ( DiffuseColor.w <= object.nodeUniform7 ) ) {

		discard;
		

	}

	DiffuseColor.w = 1.0;
	Metalness = object.nodeUniform8;
	normalViewGeometry = normalize( v_normalViewGeometry );
	nodeVar9 = max( abs( dpdx( normalViewGeometry ) ), abs( - dpdy( normalViewGeometry ) ) );
	Roughness = min( ( max( object.nodeUniform9, 0.0525 ) + max( max( nodeVar9.x, nodeVar9.y ), nodeVar9.z ) ), 1.0 );
	SpecularColor = vec3<f32>( 0.04, 0.04, 0.04 );
	SpecularColorBlended = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, Metalness );
	SpecularF90 = 1.0;
	DiffuseContribution = ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - object.nodeUniform8 ) ) );

	if ( ( object.nodeUniform5 > 0.0 ) ) {

		nodeVar10 = 3.2;

	} else {

		nodeVar10 = 0.0;

	}

	NORMAL_normalView = normalViewGeometry;
	normalView = NORMAL_normalView;
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar11 = normalize( normalWorld );
	nodeVar12 = normalize( ( render.cameraPosition - v_positionWorld ) );
	nodeVar13 = pow( ( 1.0 - clamp( dot( nodeVar11, nodeVar12 ), 0.0, 1.0 ) ), 3.0 );
	nodeVar14 = smoothstep( -0.35, 0.55, dot( nodeVar11, object.nodeUniform16 ) );
	nodeVar15 = smoothstep( -0.15, 0.85, ( - dot( nodeVar12, object.nodeUniform16 ) ) );
	EmissiveColor = ( ( ( ( ( ( mix( vec3<f32>( 0.34670405634441115, 0.6866853124288864, 1.0 ), vec3<f32>( 1.0, 0.10224173307914941, 0.0069954101845983935 ), object.nodeUniform12 ) * vec3<f32>( clamp( ( ( 0.0 + ( 1.0 - smoothstep( 0.0043749999999999995, 0.0125, length( ( nodeVarying7 - vec2<f32>( 0.139, 0.252 ) ) ) ) ) ) + ( 1.0 - smoothstep( 0.0043749999999999995, 0.0125, length( ( nodeVarying7 - vec2<f32>( 0.231, 0.252 ) ) ) ) ) ), 0.0, 1.0 ) ) ) * vec3<f32>( 1.0 ) ) * vec3<f32>( 1.6 ) ) + ( ( ( vec3<f32>( 1.0, 0.10224173307914941, 0.0069954101845983935 ) * vec3<f32>( object.nodeUniform12 ) ) * vec3<f32>( ( 1.0 - smoothstep( 0.0, 0.035, abs( ( ( mx_perlin_noise_float_0( ( nodeVarying7 * vec2<f32>( 30.0 ) ) ) * 1.0 ) + 0.0 ) ) ) ) ) ) * vec3<f32>( 0.6 ) ) ) + ( ( vec3<f32>( 1.0, 0.10224173307914941, 0.0069954101845983935 ) * vec3<f32>( smoothstep( 0.35, 1.0, nodeVar5 ) ) ) * vec3<f32>( nodeVar10 ) ) ) + ( mix( vec3<f32>( 0.0, 0.0, 0.0 ), ( ( ( ( ( object.nodeUniform13 * vec3<f32>( nodeVar13 ) ) * vec3<f32>( nodeVar14 ) ) * vec3<f32>( ( ( nodeVar15 * 1.38 ) + 0.12 ) ) ) + ( ( ( object.nodeUniform17 * vec3<f32>( nodeVar13 ) ) * vec3<f32>( ( 1.0 - ( nodeVar14 * nodeVar15 ) ) ) ) * vec3<f32>( 0.18 ) ) ) + ( ( ( nodeVar7 * vec3<f32>( 0.07 ) ) * vec3<f32>( ( 1.0 - ( smoothstep( 0.0, 0.5, dot( nodeVar7, vec3<f32>( 0.299, 0.587, 0.114 ) ) ) * 0.6 ) ) ) ) + vec3<f32>( 0.006, 0.0055, 0.005 ) ) ), object.nodeUniform18 ) * vec3<f32>( ( 1.0 - nodeVar6 ) ) ) );
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar16 = dot( normalView, positionViewDirection );
	nodeVar17 = textureSample( nodeUniform19, nodeUniform19_sampler, vec2<f32>( Roughness, clamp( nodeVar16, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar17;
	nodeVar18 = ( dfg.x + dfg.y );
	nodeVar19 = ( 1.0 / nodeVar18 );
	nodeVar20 = nodeVar19;
	nodeVar21 = ( nodeVar20 - 1.0 );
	nodeVar22 = ( SpecularColorBlended * vec3<f32>( nodeVar21 ) );
	nodeVar23 = ( nodeVar22 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar23;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar24 = dot( normalWorld, normalize( render.nodeUniform22 ) );
	nodeVar25 = ( nodeVar24 * 0.5 );
	nodeVar26 = ( nodeVar25 + 0.5 );
	nodeVar27 = mix( render.nodeUniform20, render.nodeUniform21, nodeVar26 );
	nodeVar28 = ( irradiance + nodeVar27 );
	irradiance = nodeVar28;
	nodeVar29 = ( render.nodeUniform23 - render.nodeUniform24 );
	nodeVar30 = vec4<f32>( nodeVar29, 0.0 );
	nodeVar31 = ( render.cameraViewMatrix * nodeVar30 );
	nodeVar32 = normalize( nodeVar31.xyz );
	nodeVar33 = nodeVar32;
	nodeVar34 = dot( normalView, nodeVar33 );
	nodeVar35 = ( vec3<f32>( clamp( nodeVar34, 0.0, 1.0 ) ) * render.nodeUniform25 );
	nodeVar36 = nodeVar35;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar37 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar38 = ( nodeVar36 * nodeVar37 );
	nodeVar39 = ( nodeVar33 + positionViewDirection );
	nodeVar40 = normalize( nodeVar39 );
	nodeVar41 = dot( positionViewDirection, nodeVar40 );
	nodeVar42 = clamp( nodeVar41, 0.0, 1.0 );
	nodeVar43 = exp2( ( ( ( nodeVar42 * -5.55473 ) - 6.98316 ) * nodeVar42 ) );
	nodeVar44 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar43 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar43 ) ) );
	nodeVar45 = ( vec3<f32>( 1.0 ) - nodeVar44 );
	nodeVar46 = nodeVar45;
	nodeVar47 = ( nodeVar38 * nodeVar46 );
	nodeVar48 = ( directDiffuse + nodeVar47 );
	directDiffuse = nodeVar48;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar49 = normalize( ( nodeVar33 + positionViewDirection ) );
	nodeVar50 = clamp( dot( positionViewDirection, nodeVar49 ), 0.0, 1.0 );
	nodeVar51 = exp2( ( ( ( nodeVar50 * -5.55473 ) - 6.98316 ) * nodeVar50 ) );
	nodeVar52 = ( Roughness * Roughness );
	nodeVar53 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar51 ) ) ) + vec3<f32>( ( 1.0 * nodeVar51 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar52, clamp( dot( normalView, nodeVar33 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar52, clamp( dot( normalView, nodeVar49 ), 0.0, 1.0 ) ) ) );
	nodeVar54 = ( nodeVar36 * nodeVar53 );
	nodeVar55 = ( nodeVar54 * multiScatteringCompensation );
	nodeVar56 = ( directSpecular + nodeVar55 );
	directSpecular = nodeVar56;
	nodeVar57 = ( render.nodeUniform26 - render.nodeUniform27 );
	nodeVar58 = vec4<f32>( nodeVar57, 0.0 );
	nodeVar59 = ( render.cameraViewMatrix * nodeVar58 );
	nodeVar60 = normalize( nodeVar59.xyz );
	nodeVar61 = nodeVar60;
	nodeVar62 = dot( normalView, nodeVar61 );
	shadowPositionWorld = v_positionWorld;
	nodeVar64 = ( render.nodeUniform29 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform30 ) ) ), 1.0 ) );
	nodeVar65 = ( nodeVar64.xyz / vec3<f32>( nodeVar64.w ) );
	nodeVar66 = vec3<f32>( nodeVar65.x, ( 1.0 - nodeVar65.y ), ( nodeVar65.z + render.nodeUniform31 ) );

	if ( ( ( ( ( ( nodeVar66.x >= 0.0 ) && ( nodeVar66.x <= 1.0 ) ) && ( nodeVar66.y >= 0.0 ) ) && ( nodeVar66.y <= 1.0 ) ) && ( nodeVar66.z <= 1.0 ) ) ) {

		nodeVar67 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar68 = ( render.nodeUniform33 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform34 ).x );
		nodeVar69 = ( nodeVar66.xy + ( vogelDiskSample( 0, 5, nodeVar67 ) * vec2<f32>( nodeVar68 ) ) );
		nodeVar70 = textureSampleCompare( nodeUniform32, nodeUniform32_sampler, nodeVar69, nodeVar66.z );
		nodeVar71 = ( nodeVar66.xy + ( vogelDiskSample( 1, 5, nodeVar67 ) * vec2<f32>( nodeVar68 ) ) );
		nodeVar72 = textureSampleCompare( nodeUniform32, nodeUniform32_sampler, nodeVar71, nodeVar66.z );
		nodeVar73 = ( nodeVar66.xy + ( vogelDiskSample( 2, 5, nodeVar67 ) * vec2<f32>( nodeVar68 ) ) );
		nodeVar74 = textureSampleCompare( nodeUniform32, nodeUniform32_sampler, nodeVar73, nodeVar66.z );
		nodeVar75 = ( nodeVar66.xy + ( vogelDiskSample( 3, 5, nodeVar67 ) * vec2<f32>( nodeVar68 ) ) );
		nodeVar76 = textureSampleCompare( nodeUniform32, nodeUniform32_sampler, nodeVar75, nodeVar66.z );
		nodeVar77 = ( nodeVar66.xy + ( vogelDiskSample( 4, 5, nodeVar67 ) * vec2<f32>( nodeVar68 ) ) );
		nodeVar78 = textureSampleCompare( nodeUniform32, nodeUniform32_sampler, nodeVar77, nodeVar66.z );
		nodeVar63 = ( ( ( ( ( nodeVar70 + nodeVar72 ) + nodeVar74 ) + nodeVar76 ) + nodeVar78 ) * 0.2 );

	} else {

		nodeVar63 = 1.0;

	}

	nodeVar79 = mix( 1.0, nodeVar63, render.nodeUniform35 );
	nodeVar80 = ( vec3<f32>( clamp( nodeVar62, 0.0, 1.0 ) ) * ( render.nodeUniform28 * vec3<f32>( nodeVar79 ) ) );
	nodeVar81 = nodeVar80;
	nodeVar82 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar83 = ( nodeVar81 * nodeVar82 );
	nodeVar84 = ( nodeVar61 + positionViewDirection );
	nodeVar85 = normalize( nodeVar84 );
	nodeVar86 = dot( positionViewDirection, nodeVar85 );
	nodeVar87 = clamp( nodeVar86, 0.0, 1.0 );
	nodeVar88 = exp2( ( ( ( nodeVar87 * -5.55473 ) - 6.98316 ) * nodeVar87 ) );
	nodeVar89 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar88 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar88 ) ) );
	nodeVar90 = ( vec3<f32>( 1.0 ) - nodeVar89 );
	nodeVar91 = nodeVar90;
	nodeVar92 = ( nodeVar83 * nodeVar91 );
	nodeVar93 = ( directDiffuse + nodeVar92 );
	directDiffuse = nodeVar93;
	nodeVar94 = normalize( ( nodeVar61 + positionViewDirection ) );
	nodeVar95 = clamp( dot( positionViewDirection, nodeVar94 ), 0.0, 1.0 );
	nodeVar96 = exp2( ( ( ( nodeVar95 * -5.55473 ) - 6.98316 ) * nodeVar95 ) );
	nodeVar97 = ( Roughness * Roughness );
	nodeVar98 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar96 ) ) ) + vec3<f32>( ( 1.0 * nodeVar96 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar97, clamp( dot( normalView, nodeVar61 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar97, clamp( dot( normalView, nodeVar94 ), 0.0, 1.0 ) ) ) );
	nodeVar99 = ( nodeVar81 * nodeVar98 );
	nodeVar100 = ( nodeVar99 * multiScatteringCompensation );
	nodeVar101 = ( directSpecular + nodeVar100 );
	directSpecular = nodeVar101;
	nodeVar102 = ( render.nodeUniform36 - v_positionView );
	nodeVar103 = normalize( nodeVar102 );
	nodeVar104 = dot( normalView, nodeVar103 );

	if ( ( render.nodeUniform38 > 0.0 ) ) {

		nodeVar106 = length( nodeVar102 );
		nodeVar107 = ( nodeVar106 / render.nodeUniform38 );
		nodeVar108 = clamp( ( 1.0 - ( ( ( nodeVar107 * nodeVar107 ) * nodeVar107 ) * nodeVar107 ) ), 0.0, 1.0 );
		nodeVar105 = ( ( 1.0 / max( pow( nodeVar106, render.nodeUniform39 ), 0.01 ) ) * ( nodeVar108 * nodeVar108 ) );

	} else {

		nodeVar105 = ( 1.0 / max( pow( length( nodeVar102 ), render.nodeUniform39 ), 0.01 ) );

	}

	nodeVar109 = ( render.nodeUniform37 * vec3<f32>( nodeVar105 ) );
	nodeVar110 = ( vec3<f32>( clamp( nodeVar104, 0.0, 1.0 ) ) * nodeVar109 );
	nodeVar111 = nodeVar110;
	nodeVar112 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar113 = ( nodeVar111 * nodeVar112 );
	nodeVar114 = ( nodeVar103 + positionViewDirection );
	nodeVar115 = normalize( nodeVar114 );
	nodeVar116 = dot( positionViewDirection, nodeVar115 );
	nodeVar117 = clamp( nodeVar116, 0.0, 1.0 );
	nodeVar118 = exp2( ( ( ( nodeVar117 * -5.55473 ) - 6.98316 ) * nodeVar117 ) );
	nodeVar119 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar118 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar118 ) ) );
	nodeVar120 = ( vec3<f32>( 1.0 ) - nodeVar119 );
	nodeVar121 = nodeVar120;
	nodeVar122 = ( nodeVar113 * nodeVar121 );
	nodeVar123 = ( directDiffuse + nodeVar122 );
	directDiffuse = nodeVar123;
	nodeVar124 = normalize( ( nodeVar103 + positionViewDirection ) );
	nodeVar125 = clamp( dot( positionViewDirection, nodeVar124 ), 0.0, 1.0 );
	nodeVar126 = exp2( ( ( ( nodeVar125 * -5.55473 ) - 6.98316 ) * nodeVar125 ) );
	nodeVar127 = ( Roughness * Roughness );
	nodeVar128 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar126 ) ) ) + vec3<f32>( ( 1.0 * nodeVar126 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar127, clamp( dot( normalView, nodeVar103 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar127, clamp( dot( normalView, nodeVar124 ), 0.0, 1.0 ) ) ) );
	nodeVar129 = ( nodeVar111 * nodeVar128 );
	nodeVar130 = ( nodeVar129 * multiScatteringCompensation );
	nodeVar131 = ( directSpecular + nodeVar130 );
	directSpecular = nodeVar131;
	nodeVar132 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar133 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar134 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar135 = ( SpecularF90 * dfg.y );
	nodeVar136 = ( nodeVar134 + vec3<f32>( nodeVar135 ) );
	nodeVar137 = ( nodeVar132 + nodeVar136 );
	nodeVar132 = nodeVar137;
	nodeVar138 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar139 = nodeVar138;
	nodeVar140 = ( nodeVar139 * vec3<f32>( 0.047619 ) );
	nodeVar141 = ( SpecularColor + nodeVar140 );
	nodeVar142 = ( nodeVar136 * nodeVar141 );
	nodeVar143 = ( dfg.x + dfg.y );
	nodeVar144 = ( 1.0 - nodeVar143 );
	nodeVar145 = nodeVar144;
	nodeVar146 = ( vec3<f32>( nodeVar145 ) * nodeVar141 );
	nodeVar147 = ( vec3<f32>( 1.0 ) - nodeVar146 );
	nodeVar148 = nodeVar147;
	nodeVar149 = ( nodeVar142 / nodeVar148 );
	nodeVar150 = ( nodeVar149 * vec3<f32>( nodeVar145 ) );
	nodeVar151 = ( nodeVar133 + nodeVar150 );
	nodeVar133 = nodeVar151;
	nodeVar152 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar153 = ( irradiance * nodeVar152 );
	nodeVar154 = ( nodeVar132 + nodeVar133 );
	nodeVar155 = ( vec3<f32>( 1.0 ) - nodeVar154 );
	nodeVar156 = nodeVar155;
	nodeVar157 = ( nodeVar153 * nodeVar156 );
	nodeVar158 = nodeVar157;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar159 = ( indirectDiffuse + nodeVar158 );
	indirectDiffuse = nodeVar159;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar160 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar161 = ( SpecularF90 * dfg.y );
	nodeVar162 = ( nodeVar160 + vec3<f32>( nodeVar161 ) );
	nodeVar163 = ( singleScatteringDielectric + nodeVar162 );
	singleScatteringDielectric = nodeVar163;
	nodeVar164 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar165 = nodeVar164;
	nodeVar166 = ( nodeVar165 * vec3<f32>( 0.047619 ) );
	nodeVar167 = ( SpecularColor + nodeVar166 );
	nodeVar168 = ( nodeVar162 * nodeVar167 );
	nodeVar169 = ( dfg.x + dfg.y );
	nodeVar170 = ( 1.0 - nodeVar169 );
	nodeVar171 = nodeVar170;
	nodeVar172 = ( vec3<f32>( nodeVar171 ) * nodeVar167 );
	nodeVar173 = ( vec3<f32>( 1.0 ) - nodeVar172 );
	nodeVar174 = nodeVar173;
	nodeVar175 = ( nodeVar168 / nodeVar174 );
	nodeVar176 = ( nodeVar175 * vec3<f32>( nodeVar171 ) );
	nodeVar177 = ( multiScatteringDielectric + nodeVar176 );
	multiScatteringDielectric = nodeVar177;
	nodeVar178 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar179 = ( SpecularF90 * dfg.y );
	nodeVar180 = ( nodeVar178 + vec3<f32>( nodeVar179 ) );
	nodeVar181 = ( singleScatteringMetallic + nodeVar180 );
	singleScatteringMetallic = nodeVar181;
	nodeVar182 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar183 = nodeVar182;
	nodeVar184 = ( nodeVar183 * vec3<f32>( 0.047619 ) );
	nodeVar185 = ( DiffuseColor.xyz + nodeVar184 );
	nodeVar186 = ( nodeVar180 * nodeVar185 );
	nodeVar187 = ( dfg.x + dfg.y );
	nodeVar188 = ( 1.0 - nodeVar187 );
	nodeVar189 = nodeVar188;
	nodeVar190 = ( vec3<f32>( nodeVar189 ) * nodeVar185 );
	nodeVar191 = ( vec3<f32>( 1.0 ) - nodeVar190 );
	nodeVar192 = nodeVar191;
	nodeVar193 = ( nodeVar186 / nodeVar192 );
	nodeVar194 = ( nodeVar193 * vec3<f32>( nodeVar189 ) );
	nodeVar195 = ( multiScatteringMetallic + nodeVar194 );
	multiScatteringMetallic = nodeVar195;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar196 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar197 = ( radiance * nodeVar196 );
	nodeVar198 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar199 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar200 = ( nodeVar198 * nodeVar199 );
	nodeVar201 = ( nodeVar197 + nodeVar200 );
	nodeVar202 = nodeVar201;
	nodeVar203 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar204 = ( vec3<f32>( 1.0 ) - nodeVar203 );
	nodeVar205 = nodeVar204;
	nodeVar206 = ( DiffuseContribution * nodeVar205 );
	nodeVar207 = ( nodeVar206 * nodeVar199 );
	nodeVar208 = nodeVar207;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar209 = ( indirectSpecular + nodeVar202 );
	indirectSpecular = nodeVar209;
	nodeVar210 = ( indirectDiffuse + nodeVar208 );
	indirectDiffuse = nodeVar210;
	ambientOcclusion = 1.0;
	nodeVar211 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar211;
	nodeVar212 = dot( normalView, positionViewDirection );
	nodeVar213 = ( clamp( nodeVar212, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar214 = ( Roughness * -16.0 );
	nodeVar215 = ( 1.0 - nodeVar214 );
	nodeVar216 = nodeVar215;
	nodeVar217 = ( - nodeVar216 );
	nodeVar218 = exp2( nodeVar217 );
	nodeVar219 = pow( nodeVar213, nodeVar218 );
	nodeVar220 = ( 1.0 - nodeVar219 );
	nodeVar221 = nodeVar220;
	nodeVar222 = ( ambientOcclusion - nodeVar221 );
	nodeVar223 = ( indirectSpecular * vec3<f32>( clamp( nodeVar222, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar223;
	nodeVar224 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar224;
	nodeVar225 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar225;
	nodeVar226 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar226;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar227 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar228 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform40, object.nodeUniform41, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform42 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform43 * object.nodeUniform43 ) * nodeVar227 ) * nodeVar227 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar228;

	// result

	output.color = nodeVar228;

	return output;

}
