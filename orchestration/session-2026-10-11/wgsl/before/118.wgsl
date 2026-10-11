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
@binding( 3 ) @group( 1 ) var nodeUniform14_sampler : sampler;
@binding( 4 ) @group( 1 ) var nodeUniform14 : texture_2d<f32>;
@binding( 5 ) @group( 1 ) var nodeUniform22_sampler : sampler;
@binding( 6 ) @group( 1 ) var nodeUniform22 : texture_2d<f32>;
@binding( 7 ) @group( 1 ) var nodeUniform35_sampler : sampler_comparison;
@binding( 8 ) @group( 1 ) var nodeUniform35 : texture_depth_2d;

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
	nodeUniform15 : mat3x3<f32>,
	nodeUniform16 : vec2<f32>,
	nodeUniform19 : vec3<f32>,
	nodeUniform20 : vec3<f32>,
	nodeUniform21 : f32,
	nodeUniform43 : vec3<f32>,
	nodeUniform44 : vec3<f32>,
	nodeUniform45 : vec3<f32>,
	nodeUniform46 : f32
};
@binding( 2 ) @group( 1 )
var<uniform> object : objectStruct;

struct renderStruct {
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>,
	nodeUniform24 : vec3<f32>,
	nodeUniform25 : vec3<f32>,
	nodeUniform23 : vec3<f32>,
	nodeUniform28 : vec3<f32>,
	nodeUniform31 : vec3<f32>,
	nodeUniform40 : vec3<f32>,
	nodeUniform41 : f32,
	nodeUniform42 : f32,
	nodeUniform26 : vec3<f32>,
	nodeUniform27 : vec3<f32>,
	nodeUniform29 : vec3<f32>,
	nodeUniform30 : vec3<f32>,
	nodeUniform39 : vec3<f32>,
	nodeUniform32 : mat4x4<f32>,
	nodeUniform33 : f32,
	nodeUniform34 : f32,
	nodeUniform38 : f32,
	cameraPosition : vec3<f32>,
	nodeUniform36 : f32,
	nodeUniform37 : vec2<f32>
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
var<private> nodeVar11 : vec3<f32>;
var<private> nodeVar12 : vec2<f32>;
var<private> nodeVar13 : vec3<f32>;
var<private> nodeVar14 : vec2<f32>;
var<private> nodeVar15 : vec3<f32>;
var<private> nodeVar16 : f32;
var<private> nodeVar17 : vec3<f32>;
var<private> nodeVar18 : f32;
var<private> tangentViewFrame : vec3<f32>;
var<private> NORMAL_tangentView : vec3<f32>;
var<private> bitangentViewFrame : vec3<f32>;
var<private> NORMAL_bitangentView : vec3<f32>;
var<private> NORMAL_TBNViewMatrix : mat3x3<f32>;
var<private> nodeVar19 : vec4<f32>;
var<private> nodeVar20 : vec4<f32>;
var<private> normalView : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> nodeVar21 : vec3<f32>;
var<private> nodeVar22 : vec3<f32>;
var<private> nodeVar23 : f32;
var<private> nodeVar24 : f32;
var<private> nodeVar25 : f32;
var<private> Output : vec4<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar26 : f32;
var<private> nodeVar27 : vec2<f32>;
var<private> nodeVar28 : f32;
var<private> nodeVar29 : f32;
var<private> nodeVar30 : f32;
var<private> nodeVar31 : f32;
var<private> nodeVar32 : vec3<f32>;
var<private> nodeVar33 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> nodeVar34 : f32;
var<private> nodeVar35 : f32;
var<private> nodeVar36 : f32;
var<private> nodeVar37 : vec3<f32>;
var<private> nodeVar38 : vec3<f32>;
var<private> nodeVar39 : vec3<f32>;
var<private> nodeVar40 : vec4<f32>;
var<private> nodeVar41 : vec4<f32>;
var<private> nodeVar42 : vec3<f32>;
var<private> nodeVar43 : vec3<f32>;
var<private> nodeVar44 : f32;
var<private> nodeVar45 : vec3<f32>;
var<private> nodeVar46 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar47 : vec3<f32>;
var<private> nodeVar48 : vec3<f32>;
var<private> nodeVar49 : vec3<f32>;
var<private> nodeVar50 : vec3<f32>;
var<private> nodeVar51 : f32;
var<private> nodeVar52 : f32;
var<private> nodeVar53 : f32;
var<private> nodeVar54 : vec3<f32>;
var<private> nodeVar55 : vec3<f32>;
var<private> nodeVar56 : vec3<f32>;
var<private> nodeVar57 : vec3<f32>;
var<private> nodeVar58 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar59 : vec3<f32>;
var<private> nodeVar60 : f32;
var<private> nodeVar61 : f32;
var<private> nodeVar62 : f32;
var<private> nodeVar63 : vec3<f32>;
var<private> nodeVar64 : vec3<f32>;
var<private> nodeVar65 : vec3<f32>;
var<private> nodeVar66 : vec3<f32>;
var<private> nodeVar67 : vec3<f32>;
var<private> nodeVar68 : vec4<f32>;
var<private> nodeVar69 : vec4<f32>;
var<private> nodeVar70 : vec3<f32>;
var<private> nodeVar71 : vec3<f32>;
var<private> nodeVar72 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar73 : f32;
var<private> nodeVar74 : vec4<f32>;
var<private> nodeVar75 : vec3<f32>;
var<private> nodeVar76 : vec3<f32>;
var<private> nodeVar77 : f32;
var<private> nodeVar78 : f32;
var<private> nodeVar79 : vec2<f32>;
var<private> nodeVar80 : f32;
var<private> nodeVar81 : vec2<f32>;
var<private> nodeVar82 : f32;
var<private> nodeVar83 : vec2<f32>;
var<private> nodeVar84 : f32;
var<private> nodeVar85 : vec2<f32>;
var<private> nodeVar86 : f32;
var<private> nodeVar87 : vec2<f32>;
var<private> nodeVar88 : f32;
var<private> nodeVar89 : f32;
var<private> nodeVar90 : vec3<f32>;
var<private> nodeVar91 : vec3<f32>;
var<private> nodeVar92 : vec3<f32>;
var<private> nodeVar93 : vec3<f32>;
var<private> nodeVar94 : vec3<f32>;
var<private> nodeVar95 : vec3<f32>;
var<private> nodeVar96 : f32;
var<private> nodeVar97 : f32;
var<private> nodeVar98 : f32;
var<private> nodeVar99 : vec3<f32>;
var<private> nodeVar100 : vec3<f32>;
var<private> nodeVar101 : vec3<f32>;
var<private> nodeVar102 : vec3<f32>;
var<private> nodeVar103 : vec3<f32>;
var<private> nodeVar104 : vec3<f32>;
var<private> nodeVar105 : f32;
var<private> nodeVar106 : f32;
var<private> nodeVar107 : f32;
var<private> nodeVar108 : vec3<f32>;
var<private> nodeVar109 : vec3<f32>;
var<private> nodeVar110 : vec3<f32>;
var<private> nodeVar111 : vec3<f32>;
var<private> nodeVar112 : vec3<f32>;
var<private> nodeVar113 : vec3<f32>;
var<private> nodeVar114 : f32;
var<private> nodeVar115 : f32;
var<private> nodeVar116 : f32;
var<private> nodeVar117 : f32;
var<private> nodeVar118 : f32;
var<private> nodeVar119 : vec3<f32>;
var<private> nodeVar120 : vec3<f32>;
var<private> nodeVar121 : vec3<f32>;
var<private> nodeVar122 : vec3<f32>;
var<private> nodeVar123 : vec3<f32>;
var<private> nodeVar124 : vec3<f32>;
var<private> nodeVar125 : vec3<f32>;
var<private> nodeVar126 : f32;
var<private> nodeVar127 : f32;
var<private> nodeVar128 : f32;
var<private> nodeVar129 : vec3<f32>;
var<private> nodeVar130 : vec3<f32>;
var<private> nodeVar131 : vec3<f32>;
var<private> nodeVar132 : vec3<f32>;
var<private> nodeVar133 : vec3<f32>;
var<private> nodeVar134 : vec3<f32>;
var<private> nodeVar135 : f32;
var<private> nodeVar136 : f32;
var<private> nodeVar137 : f32;
var<private> nodeVar138 : vec3<f32>;
var<private> nodeVar139 : vec3<f32>;
var<private> nodeVar140 : vec3<f32>;
var<private> nodeVar141 : vec3<f32>;
var<private> nodeVar142 : vec3<f32>;
var<private> nodeVar143 : vec3<f32>;
var<private> nodeVar144 : vec3<f32>;
var<private> nodeVar145 : f32;
var<private> nodeVar146 : vec3<f32>;
var<private> nodeVar147 : vec3<f32>;
var<private> nodeVar148 : vec3<f32>;
var<private> nodeVar149 : vec3<f32>;
var<private> nodeVar150 : vec3<f32>;
var<private> nodeVar151 : vec3<f32>;
var<private> nodeVar152 : vec3<f32>;
var<private> nodeVar153 : f32;
var<private> nodeVar154 : f32;
var<private> nodeVar155 : f32;
var<private> nodeVar156 : vec3<f32>;
var<private> nodeVar157 : vec3<f32>;
var<private> nodeVar158 : vec3<f32>;
var<private> nodeVar159 : vec3<f32>;
var<private> nodeVar160 : vec3<f32>;
var<private> nodeVar161 : vec3<f32>;
var<private> nodeVar162 : vec3<f32>;
var<private> nodeVar163 : vec3<f32>;
var<private> nodeVar164 : vec3<f32>;
var<private> nodeVar165 : vec3<f32>;
var<private> nodeVar166 : vec3<f32>;
var<private> nodeVar167 : vec3<f32>;
var<private> nodeVar168 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar169 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar170 : vec3<f32>;
var<private> nodeVar171 : f32;
var<private> nodeVar172 : vec3<f32>;
var<private> nodeVar173 : vec3<f32>;
var<private> nodeVar174 : vec3<f32>;
var<private> nodeVar175 : vec3<f32>;
var<private> nodeVar176 : vec3<f32>;
var<private> nodeVar177 : vec3<f32>;
var<private> nodeVar178 : vec3<f32>;
var<private> nodeVar179 : f32;
var<private> nodeVar180 : f32;
var<private> nodeVar181 : f32;
var<private> nodeVar182 : vec3<f32>;
var<private> nodeVar183 : vec3<f32>;
var<private> nodeVar184 : vec3<f32>;
var<private> nodeVar185 : vec3<f32>;
var<private> nodeVar186 : vec3<f32>;
var<private> nodeVar187 : vec3<f32>;
var<private> nodeVar188 : vec3<f32>;
var<private> nodeVar189 : f32;
var<private> nodeVar190 : vec3<f32>;
var<private> nodeVar191 : vec3<f32>;
var<private> nodeVar192 : vec3<f32>;
var<private> nodeVar193 : vec3<f32>;
var<private> nodeVar194 : vec3<f32>;
var<private> nodeVar195 : vec3<f32>;
var<private> nodeVar196 : vec3<f32>;
var<private> nodeVar197 : f32;
var<private> nodeVar198 : f32;
var<private> nodeVar199 : f32;
var<private> nodeVar200 : vec3<f32>;
var<private> nodeVar201 : vec3<f32>;
var<private> nodeVar202 : vec3<f32>;
var<private> nodeVar203 : vec3<f32>;
var<private> nodeVar204 : vec3<f32>;
var<private> nodeVar205 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar206 : vec3<f32>;
var<private> nodeVar207 : vec3<f32>;
var<private> nodeVar208 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar209 : vec3<f32>;
var<private> nodeVar210 : vec3<f32>;
var<private> nodeVar211 : vec3<f32>;
var<private> nodeVar212 : vec3<f32>;
var<private> nodeVar213 : vec3<f32>;
var<private> nodeVar214 : vec3<f32>;
var<private> nodeVar215 : vec3<f32>;
var<private> nodeVar216 : vec3<f32>;
var<private> nodeVar217 : vec3<f32>;
var<private> nodeVar218 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar219 : vec3<f32>;
var<private> nodeVar220 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar221 : vec3<f32>;
var<private> nodeVar222 : f32;
var<private> nodeVar223 : f32;
var<private> nodeVar224 : f32;
var<private> nodeVar225 : f32;
var<private> nodeVar226 : f32;
var<private> nodeVar227 : f32;
var<private> nodeVar228 : f32;
var<private> nodeVar229 : f32;
var<private> nodeVar230 : f32;
var<private> nodeVar231 : f32;
var<private> nodeVar232 : f32;
var<private> nodeVar233 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar234 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar235 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar236 : vec3<f32>;
var<private> nodeVar237 : f32;
var<private> nodeVar238 : vec4<f32>;

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
	nodeVar7 = mix( mix( ( ( vec3<f32>( 0.14412847084818123, 0.11443537381770343, 0.09758734713304495 ) * vec3<f32>( ( ( nodeVar2 * 1.6 ) + 0.45 ) ) ) * vec3<f32>( 3.4 ) ), ( ( vec3<f32>( 0.04518620437910499, 0.04231141061442144, 0.04817182422013895 ) * vec3<f32>( ( nodeVar2 + 0.4 ) ) ) * vec3<f32>( 3.4 ) ), ( smoothstep( -0.35, 0.6, ( ( mx_perlin_noise_float_0( ( nodeVarying7 * vec2<f32>( 9.0 ) ) ) * 1.0 ) + 0.0 ) ) * 0.5 ) ), vec3<f32>( 0.007499032040460618, 0.005605391621829108, 0.004776953478513362 ), ( nodeVar6 * 0.9 ) );
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
	nodeVar11 = cross( - dpdy( v_positionView ), NORMAL_normalView );
	nodeVar12 = dpdx( nodeVarying7 );
	nodeVar13 = cross( NORMAL_normalView, dpdx( v_positionView ) );
	nodeVar14 = - dpdy( nodeVarying7 );
	nodeVar15 = ( ( nodeVar11 * vec3<f32>( nodeVar12.x ) ) + ( nodeVar13 * vec3<f32>( nodeVar14.x ) ) );
	nodeVar17 = ( ( nodeVar11 * vec3<f32>( nodeVar12.y ) ) + ( nodeVar13 * vec3<f32>( nodeVar14.y ) ) );
	nodeVar18 = max( dot( nodeVar15, nodeVar15 ), dot( nodeVar17, nodeVar17 ) );

	if ( ( nodeVar18 == 0.0 ) ) {

		nodeVar16 = 0.0;

	} else {

		nodeVar16 = inverseSqrt( nodeVar18 );

	}

	tangentViewFrame = ( nodeVar15 * vec3<f32>( nodeVar16 ) );
	NORMAL_tangentView = tangentViewFrame;
	bitangentViewFrame = ( nodeVar17 * nodeVar16 );
	NORMAL_bitangentView = bitangentViewFrame;
	NORMAL_TBNViewMatrix = mat3x3<f32>( NORMAL_tangentView, NORMAL_bitangentView, NORMAL_normalView );
	nodeVar19 = textureSample( nodeUniform14, nodeUniform14_sampler, ( object.nodeUniform15 * vec3<f32>( nodeVarying7, 1.0 ) ).xy );
	nodeVar20 = ( ( nodeVar19 * vec4<f32>( 2.0 ) ) - vec4<f32>( 1.0 ) );
	normalView = normalize( ( NORMAL_TBNViewMatrix * vec3<f32>( ( nodeVar20.xy * object.nodeUniform16 ), nodeVar20.z ) ) );
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar21 = normalize( normalWorld );
	nodeVar22 = normalize( ( render.cameraPosition - v_positionWorld ) );
	nodeVar23 = pow( ( 1.0 - clamp( dot( nodeVar21, nodeVar22 ), 0.0, 1.0 ) ), 3.0 );
	nodeVar24 = smoothstep( -0.35, 0.55, dot( nodeVar21, object.nodeUniform19 ) );
	nodeVar25 = smoothstep( -0.15, 0.85, ( - dot( nodeVar22, object.nodeUniform19 ) ) );
	EmissiveColor = ( ( ( ( ( ( mix( vec3<f32>( 0.34670405634441115, 0.6866853124288864, 1.0 ), vec3<f32>( 1.0, 0.10224173307914941, 0.0069954101845983935 ), object.nodeUniform12 ) * vec3<f32>( clamp( ( ( 0.0 + ( 1.0 - smoothstep( 0.0043749999999999995, 0.0125, length( ( nodeVarying7 - vec2<f32>( 0.139, 0.252 ) ) ) ) ) ) + ( 1.0 - smoothstep( 0.0043749999999999995, 0.0125, length( ( nodeVarying7 - vec2<f32>( 0.231, 0.252 ) ) ) ) ) ), 0.0, 1.0 ) ) ) * vec3<f32>( 0.0 ) ) * vec3<f32>( 1.6 ) ) + ( ( ( vec3<f32>( 1.0, 0.10224173307914941, 0.0069954101845983935 ) * vec3<f32>( object.nodeUniform12 ) ) * vec3<f32>( ( 1.0 - smoothstep( 0.0, 0.035, abs( ( ( mx_perlin_noise_float_0( ( nodeVarying7 * vec2<f32>( 30.0 ) ) ) * 1.0 ) + 0.0 ) ) ) ) ) ) * vec3<f32>( 0.6 ) ) ) + ( ( vec3<f32>( 1.0, 0.10224173307914941, 0.0069954101845983935 ) * vec3<f32>( smoothstep( 0.35, 1.0, nodeVar5 ) ) ) * vec3<f32>( nodeVar10 ) ) ) + ( mix( vec3<f32>( 0.0, 0.0, 0.0 ), ( ( ( ( ( object.nodeUniform13 * vec3<f32>( nodeVar23 ) ) * vec3<f32>( nodeVar24 ) ) * vec3<f32>( ( ( nodeVar25 * 1.38 ) + 0.12 ) ) ) + ( ( ( object.nodeUniform20 * vec3<f32>( nodeVar23 ) ) * vec3<f32>( ( 1.0 - ( nodeVar24 * nodeVar25 ) ) ) ) * vec3<f32>( 0.18 ) ) ) + ( ( ( nodeVar7 * vec3<f32>( 0.07 ) ) * vec3<f32>( ( 1.0 - ( smoothstep( 0.0, 0.5, dot( nodeVar7, vec3<f32>( 0.299, 0.587, 0.114 ) ) ) * 0.6 ) ) ) ) + vec3<f32>( 0.006, 0.0055, 0.005 ) ) ), object.nodeUniform21 ) * vec3<f32>( ( 1.0 - nodeVar6 ) ) ) );
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar26 = dot( normalView, positionViewDirection );
	nodeVar27 = textureSample( nodeUniform22, nodeUniform22_sampler, vec2<f32>( Roughness, clamp( nodeVar26, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar27;
	nodeVar28 = ( dfg.x + dfg.y );
	nodeVar29 = ( 1.0 / nodeVar28 );
	nodeVar30 = nodeVar29;
	nodeVar31 = ( nodeVar30 - 1.0 );
	nodeVar32 = ( SpecularColorBlended * vec3<f32>( nodeVar31 ) );
	nodeVar33 = ( nodeVar32 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar33;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar34 = dot( normalWorld, normalize( render.nodeUniform25 ) );
	nodeVar35 = ( nodeVar34 * 0.5 );
	nodeVar36 = ( nodeVar35 + 0.5 );
	nodeVar37 = mix( render.nodeUniform23, render.nodeUniform24, nodeVar36 );
	nodeVar38 = ( irradiance + nodeVar37 );
	irradiance = nodeVar38;
	nodeVar39 = ( render.nodeUniform26 - render.nodeUniform27 );
	nodeVar40 = vec4<f32>( nodeVar39, 0.0 );
	nodeVar41 = ( render.cameraViewMatrix * nodeVar40 );
	nodeVar42 = normalize( nodeVar41.xyz );
	nodeVar43 = nodeVar42;
	nodeVar44 = dot( normalView, nodeVar43 );
	nodeVar45 = ( vec3<f32>( clamp( nodeVar44, 0.0, 1.0 ) ) * render.nodeUniform28 );
	nodeVar46 = nodeVar45;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar47 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar48 = ( nodeVar46 * nodeVar47 );
	nodeVar49 = ( nodeVar43 + positionViewDirection );
	nodeVar50 = normalize( nodeVar49 );
	nodeVar51 = dot( positionViewDirection, nodeVar50 );
	nodeVar52 = clamp( nodeVar51, 0.0, 1.0 );
	nodeVar53 = exp2( ( ( ( nodeVar52 * -5.55473 ) - 6.98316 ) * nodeVar52 ) );
	nodeVar54 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar53 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar53 ) ) );
	nodeVar55 = ( vec3<f32>( 1.0 ) - nodeVar54 );
	nodeVar56 = nodeVar55;
	nodeVar57 = ( nodeVar48 * nodeVar56 );
	nodeVar58 = ( directDiffuse + nodeVar57 );
	directDiffuse = nodeVar58;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar59 = normalize( ( nodeVar43 + positionViewDirection ) );
	nodeVar60 = clamp( dot( positionViewDirection, nodeVar59 ), 0.0, 1.0 );
	nodeVar61 = exp2( ( ( ( nodeVar60 * -5.55473 ) - 6.98316 ) * nodeVar60 ) );
	nodeVar62 = ( Roughness * Roughness );
	nodeVar63 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar61 ) ) ) + vec3<f32>( ( 1.0 * nodeVar61 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar62, clamp( dot( normalView, nodeVar43 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar62, clamp( dot( normalView, nodeVar59 ), 0.0, 1.0 ) ) ) );
	nodeVar64 = ( nodeVar46 * nodeVar63 );
	nodeVar65 = ( nodeVar64 * multiScatteringCompensation );
	nodeVar66 = ( directSpecular + nodeVar65 );
	directSpecular = nodeVar66;
	nodeVar67 = ( render.nodeUniform29 - render.nodeUniform30 );
	nodeVar68 = vec4<f32>( nodeVar67, 0.0 );
	nodeVar69 = ( render.cameraViewMatrix * nodeVar68 );
	nodeVar70 = normalize( nodeVar69.xyz );
	nodeVar71 = nodeVar70;
	nodeVar72 = dot( normalView, nodeVar71 );
	shadowPositionWorld = v_positionWorld;
	nodeVar74 = ( render.nodeUniform32 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform33 ) ) ), 1.0 ) );
	nodeVar75 = ( nodeVar74.xyz / vec3<f32>( nodeVar74.w ) );
	nodeVar76 = vec3<f32>( nodeVar75.x, ( 1.0 - nodeVar75.y ), ( nodeVar75.z + render.nodeUniform34 ) );

	if ( ( ( ( ( ( nodeVar76.x >= 0.0 ) && ( nodeVar76.x <= 1.0 ) ) && ( nodeVar76.y >= 0.0 ) ) && ( nodeVar76.y <= 1.0 ) ) && ( nodeVar76.z <= 1.0 ) ) ) {

		nodeVar77 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar78 = ( render.nodeUniform36 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform37 ).x );
		nodeVar79 = ( nodeVar76.xy + ( vogelDiskSample( 0, 5, nodeVar77 ) * vec2<f32>( nodeVar78 ) ) );
		nodeVar80 = textureSampleCompare( nodeUniform35, nodeUniform35_sampler, nodeVar79, nodeVar76.z );
		nodeVar81 = ( nodeVar76.xy + ( vogelDiskSample( 1, 5, nodeVar77 ) * vec2<f32>( nodeVar78 ) ) );
		nodeVar82 = textureSampleCompare( nodeUniform35, nodeUniform35_sampler, nodeVar81, nodeVar76.z );
		nodeVar83 = ( nodeVar76.xy + ( vogelDiskSample( 2, 5, nodeVar77 ) * vec2<f32>( nodeVar78 ) ) );
		nodeVar84 = textureSampleCompare( nodeUniform35, nodeUniform35_sampler, nodeVar83, nodeVar76.z );
		nodeVar85 = ( nodeVar76.xy + ( vogelDiskSample( 3, 5, nodeVar77 ) * vec2<f32>( nodeVar78 ) ) );
		nodeVar86 = textureSampleCompare( nodeUniform35, nodeUniform35_sampler, nodeVar85, nodeVar76.z );
		nodeVar87 = ( nodeVar76.xy + ( vogelDiskSample( 4, 5, nodeVar77 ) * vec2<f32>( nodeVar78 ) ) );
		nodeVar88 = textureSampleCompare( nodeUniform35, nodeUniform35_sampler, nodeVar87, nodeVar76.z );
		nodeVar73 = ( ( ( ( ( nodeVar80 + nodeVar82 ) + nodeVar84 ) + nodeVar86 ) + nodeVar88 ) * 0.2 );

	} else {

		nodeVar73 = 1.0;

	}

	nodeVar89 = mix( 1.0, nodeVar73, render.nodeUniform38 );
	nodeVar90 = ( vec3<f32>( clamp( nodeVar72, 0.0, 1.0 ) ) * ( render.nodeUniform31 * vec3<f32>( nodeVar89 ) ) );
	nodeVar91 = nodeVar90;
	nodeVar92 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar93 = ( nodeVar91 * nodeVar92 );
	nodeVar94 = ( nodeVar71 + positionViewDirection );
	nodeVar95 = normalize( nodeVar94 );
	nodeVar96 = dot( positionViewDirection, nodeVar95 );
	nodeVar97 = clamp( nodeVar96, 0.0, 1.0 );
	nodeVar98 = exp2( ( ( ( nodeVar97 * -5.55473 ) - 6.98316 ) * nodeVar97 ) );
	nodeVar99 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar98 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar98 ) ) );
	nodeVar100 = ( vec3<f32>( 1.0 ) - nodeVar99 );
	nodeVar101 = nodeVar100;
	nodeVar102 = ( nodeVar93 * nodeVar101 );
	nodeVar103 = ( directDiffuse + nodeVar102 );
	directDiffuse = nodeVar103;
	nodeVar104 = normalize( ( nodeVar71 + positionViewDirection ) );
	nodeVar105 = clamp( dot( positionViewDirection, nodeVar104 ), 0.0, 1.0 );
	nodeVar106 = exp2( ( ( ( nodeVar105 * -5.55473 ) - 6.98316 ) * nodeVar105 ) );
	nodeVar107 = ( Roughness * Roughness );
	nodeVar108 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar106 ) ) ) + vec3<f32>( ( 1.0 * nodeVar106 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar107, clamp( dot( normalView, nodeVar71 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar107, clamp( dot( normalView, nodeVar104 ), 0.0, 1.0 ) ) ) );
	nodeVar109 = ( nodeVar91 * nodeVar108 );
	nodeVar110 = ( nodeVar109 * multiScatteringCompensation );
	nodeVar111 = ( directSpecular + nodeVar110 );
	directSpecular = nodeVar111;
	nodeVar112 = ( render.nodeUniform39 - v_positionView );
	nodeVar113 = normalize( nodeVar112 );
	nodeVar114 = dot( normalView, nodeVar113 );

	if ( ( render.nodeUniform41 > 0.0 ) ) {

		nodeVar116 = length( nodeVar112 );
		nodeVar117 = ( nodeVar116 / render.nodeUniform41 );
		nodeVar118 = clamp( ( 1.0 - ( ( ( nodeVar117 * nodeVar117 ) * nodeVar117 ) * nodeVar117 ) ), 0.0, 1.0 );
		nodeVar115 = ( ( 1.0 / max( pow( nodeVar116, render.nodeUniform42 ), 0.01 ) ) * ( nodeVar118 * nodeVar118 ) );

	} else {

		nodeVar115 = ( 1.0 / max( pow( length( nodeVar112 ), render.nodeUniform42 ), 0.01 ) );

	}

	nodeVar119 = ( render.nodeUniform40 * vec3<f32>( nodeVar115 ) );
	nodeVar120 = ( vec3<f32>( clamp( nodeVar114, 0.0, 1.0 ) ) * nodeVar119 );
	nodeVar121 = nodeVar120;
	nodeVar122 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar123 = ( nodeVar121 * nodeVar122 );
	nodeVar124 = ( nodeVar113 + positionViewDirection );
	nodeVar125 = normalize( nodeVar124 );
	nodeVar126 = dot( positionViewDirection, nodeVar125 );
	nodeVar127 = clamp( nodeVar126, 0.0, 1.0 );
	nodeVar128 = exp2( ( ( ( nodeVar127 * -5.55473 ) - 6.98316 ) * nodeVar127 ) );
	nodeVar129 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar128 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar128 ) ) );
	nodeVar130 = ( vec3<f32>( 1.0 ) - nodeVar129 );
	nodeVar131 = nodeVar130;
	nodeVar132 = ( nodeVar123 * nodeVar131 );
	nodeVar133 = ( directDiffuse + nodeVar132 );
	directDiffuse = nodeVar133;
	nodeVar134 = normalize( ( nodeVar113 + positionViewDirection ) );
	nodeVar135 = clamp( dot( positionViewDirection, nodeVar134 ), 0.0, 1.0 );
	nodeVar136 = exp2( ( ( ( nodeVar135 * -5.55473 ) - 6.98316 ) * nodeVar135 ) );
	nodeVar137 = ( Roughness * Roughness );
	nodeVar138 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar136 ) ) ) + vec3<f32>( ( 1.0 * nodeVar136 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar137, clamp( dot( normalView, nodeVar113 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar137, clamp( dot( normalView, nodeVar134 ), 0.0, 1.0 ) ) ) );
	nodeVar139 = ( nodeVar121 * nodeVar138 );
	nodeVar140 = ( nodeVar139 * multiScatteringCompensation );
	nodeVar141 = ( directSpecular + nodeVar140 );
	directSpecular = nodeVar141;
	nodeVar142 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar143 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar144 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar145 = ( SpecularF90 * dfg.y );
	nodeVar146 = ( nodeVar144 + vec3<f32>( nodeVar145 ) );
	nodeVar147 = ( nodeVar142 + nodeVar146 );
	nodeVar142 = nodeVar147;
	nodeVar148 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar149 = nodeVar148;
	nodeVar150 = ( nodeVar149 * vec3<f32>( 0.047619 ) );
	nodeVar151 = ( SpecularColor + nodeVar150 );
	nodeVar152 = ( nodeVar146 * nodeVar151 );
	nodeVar153 = ( dfg.x + dfg.y );
	nodeVar154 = ( 1.0 - nodeVar153 );
	nodeVar155 = nodeVar154;
	nodeVar156 = ( vec3<f32>( nodeVar155 ) * nodeVar151 );
	nodeVar157 = ( vec3<f32>( 1.0 ) - nodeVar156 );
	nodeVar158 = nodeVar157;
	nodeVar159 = ( nodeVar152 / nodeVar158 );
	nodeVar160 = ( nodeVar159 * vec3<f32>( nodeVar155 ) );
	nodeVar161 = ( nodeVar143 + nodeVar160 );
	nodeVar143 = nodeVar161;
	nodeVar162 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar163 = ( irradiance * nodeVar162 );
	nodeVar164 = ( nodeVar142 + nodeVar143 );
	nodeVar165 = ( vec3<f32>( 1.0 ) - nodeVar164 );
	nodeVar166 = nodeVar165;
	nodeVar167 = ( nodeVar163 * nodeVar166 );
	nodeVar168 = nodeVar167;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar169 = ( indirectDiffuse + nodeVar168 );
	indirectDiffuse = nodeVar169;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar170 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar171 = ( SpecularF90 * dfg.y );
	nodeVar172 = ( nodeVar170 + vec3<f32>( nodeVar171 ) );
	nodeVar173 = ( singleScatteringDielectric + nodeVar172 );
	singleScatteringDielectric = nodeVar173;
	nodeVar174 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar175 = nodeVar174;
	nodeVar176 = ( nodeVar175 * vec3<f32>( 0.047619 ) );
	nodeVar177 = ( SpecularColor + nodeVar176 );
	nodeVar178 = ( nodeVar172 * nodeVar177 );
	nodeVar179 = ( dfg.x + dfg.y );
	nodeVar180 = ( 1.0 - nodeVar179 );
	nodeVar181 = nodeVar180;
	nodeVar182 = ( vec3<f32>( nodeVar181 ) * nodeVar177 );
	nodeVar183 = ( vec3<f32>( 1.0 ) - nodeVar182 );
	nodeVar184 = nodeVar183;
	nodeVar185 = ( nodeVar178 / nodeVar184 );
	nodeVar186 = ( nodeVar185 * vec3<f32>( nodeVar181 ) );
	nodeVar187 = ( multiScatteringDielectric + nodeVar186 );
	multiScatteringDielectric = nodeVar187;
	nodeVar188 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar189 = ( SpecularF90 * dfg.y );
	nodeVar190 = ( nodeVar188 + vec3<f32>( nodeVar189 ) );
	nodeVar191 = ( singleScatteringMetallic + nodeVar190 );
	singleScatteringMetallic = nodeVar191;
	nodeVar192 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar193 = nodeVar192;
	nodeVar194 = ( nodeVar193 * vec3<f32>( 0.047619 ) );
	nodeVar195 = ( DiffuseColor.xyz + nodeVar194 );
	nodeVar196 = ( nodeVar190 * nodeVar195 );
	nodeVar197 = ( dfg.x + dfg.y );
	nodeVar198 = ( 1.0 - nodeVar197 );
	nodeVar199 = nodeVar198;
	nodeVar200 = ( vec3<f32>( nodeVar199 ) * nodeVar195 );
	nodeVar201 = ( vec3<f32>( 1.0 ) - nodeVar200 );
	nodeVar202 = nodeVar201;
	nodeVar203 = ( nodeVar196 / nodeVar202 );
	nodeVar204 = ( nodeVar203 * vec3<f32>( nodeVar199 ) );
	nodeVar205 = ( multiScatteringMetallic + nodeVar204 );
	multiScatteringMetallic = nodeVar205;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar206 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar207 = ( radiance * nodeVar206 );
	nodeVar208 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar209 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar210 = ( nodeVar208 * nodeVar209 );
	nodeVar211 = ( nodeVar207 + nodeVar210 );
	nodeVar212 = nodeVar211;
	nodeVar213 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar214 = ( vec3<f32>( 1.0 ) - nodeVar213 );
	nodeVar215 = nodeVar214;
	nodeVar216 = ( DiffuseContribution * nodeVar215 );
	nodeVar217 = ( nodeVar216 * nodeVar209 );
	nodeVar218 = nodeVar217;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar219 = ( indirectSpecular + nodeVar212 );
	indirectSpecular = nodeVar219;
	nodeVar220 = ( indirectDiffuse + nodeVar218 );
	indirectDiffuse = nodeVar220;
	ambientOcclusion = 1.0;
	nodeVar221 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar221;
	nodeVar222 = dot( normalView, positionViewDirection );
	nodeVar223 = ( clamp( nodeVar222, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar224 = ( Roughness * -16.0 );
	nodeVar225 = ( 1.0 - nodeVar224 );
	nodeVar226 = nodeVar225;
	nodeVar227 = ( - nodeVar226 );
	nodeVar228 = exp2( nodeVar227 );
	nodeVar229 = pow( nodeVar223, nodeVar228 );
	nodeVar230 = ( 1.0 - nodeVar229 );
	nodeVar231 = nodeVar230;
	nodeVar232 = ( ambientOcclusion - nodeVar231 );
	nodeVar233 = ( indirectSpecular * vec3<f32>( clamp( nodeVar232, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar233;
	nodeVar234 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar234;
	nodeVar235 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar235;
	nodeVar236 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar236;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar237 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar238 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform43, object.nodeUniform44, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform45 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform46 * object.nodeUniform46 ) * nodeVar237 ) * nodeVar237 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar238;

	// result

	output.color = nodeVar238;

	return output;

}
