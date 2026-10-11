// Three.js r186 - Node System

// global
diagnostic( off, derivative_uniformity );


// structs

struct OutputStruct {
	@location( 0 ) color: vec4<f32>
};
var<private> output : OutputStruct;

// uniforms
@binding( 1 ) @group( 1 ) var nodeUniform21_sampler : sampler;
@binding( 2 ) @group( 1 ) var nodeUniform21 : texture_2d<f32>;
@binding( 3 ) @group( 1 ) var nodeUniform34_sampler : sampler_comparison;
@binding( 4 ) @group( 1 ) var nodeUniform34 : texture_depth_2d;

struct renderStruct {
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>,
	nodeUniform23 : vec3<f32>,
	nodeUniform24 : vec3<f32>,
	nodeUniform22 : vec3<f32>,
	nodeUniform27 : vec3<f32>,
	nodeUniform30 : vec3<f32>,
	nodeUniform39 : vec3<f32>,
	nodeUniform40 : f32,
	nodeUniform41 : f32,
	nodeUniform25 : vec3<f32>,
	nodeUniform26 : vec3<f32>,
	nodeUniform28 : vec3<f32>,
	nodeUniform29 : vec3<f32>,
	nodeUniform38 : vec3<f32>,
	nodeUniform31 : mat4x4<f32>,
	nodeUniform32 : f32,
	nodeUniform33 : f32,
	nodeUniform37 : f32,
	cameraPosition : vec3<f32>,
	nodeUniform35 : f32,
	nodeUniform36 : vec2<f32>
};
@binding( 0 ) @group( 0 )
var<uniform> render : renderStruct;

struct objectStruct {
	nodeUniform0 : f32,
	nodeUniform2 : mat3x3<f32>,
	nodeUniform4 : f32,
	nodeUniform5 : mat4x4<f32>,
	nodeUniform6 : f32,
	nodeUniform7 : f32,
	nodeUniform8 : f32,
	nodeUniform9 : f32,
	nodeUniform10 : vec3<f32>,
	nodeUniform12 : vec3<f32>,
	nodeUniform13 : vec3<f32>,
	nodeUniform14 : vec3<f32>,
	nodeUniform15 : f32,
	nodeUniform16 : f32,
	nodeUniform17 : f32,
	nodeUniform18 : f32,
	nodeUniform19 : f32,
	nodeUniform20 : f32,
	nodeUniform42 : vec3<f32>,
	nodeUniform43 : vec3<f32>,
	nodeUniform44 : vec3<f32>,
	nodeUniform45 : f32
};
@binding( 0 ) @group( 1 )
var<uniform> object : objectStruct;

// vars
var<private> DiffuseColor : vec4<f32>;
var<private> normalViewGeometry : vec3<f32>;
var<private> NORMAL_normalView : vec3<f32>;
var<private> normalView : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> nodeVar0 : f32;
var<private> nodeVar1 : f32;
var<private> nodeVar2 : f32;
var<private> nodeVar3 : f32;
var<private> nodeVar4 : vec3<f32>;
var<private> nodeVar5 : f32;
var<private> Metalness : f32;
var<private> Roughness : f32;
var<private> nodeVar6 : vec3<f32>;
var<private> SpecularColor : vec3<f32>;
var<private> SpecularColorBlended : vec3<f32>;
var<private> SpecularF90 : f32;
var<private> DiffuseContribution : vec3<f32>;
var<private> EmissiveColor : vec3<f32>;
var<private> nodeVar7 : vec3<f32>;
var<private> nodeVar8 : f32;
var<private> nodeVar9 : vec3<f32>;
var<private> nodeVar10 : vec3<f32>;
var<private> nodeVar11 : f32;
var<private> nodeVar12 : f32;
var<private> nodeVar13 : f32;
var<private> Output : vec4<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar14 : f32;
var<private> nodeVar15 : vec2<f32>;
var<private> nodeVar16 : f32;
var<private> nodeVar17 : f32;
var<private> nodeVar18 : f32;
var<private> nodeVar19 : f32;
var<private> nodeVar20 : vec3<f32>;
var<private> nodeVar21 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> nodeVar22 : f32;
var<private> nodeVar23 : f32;
var<private> nodeVar24 : f32;
var<private> nodeVar25 : vec3<f32>;
var<private> nodeVar26 : vec3<f32>;
var<private> nodeVar27 : vec3<f32>;
var<private> nodeVar28 : vec4<f32>;
var<private> nodeVar29 : vec4<f32>;
var<private> nodeVar30 : vec3<f32>;
var<private> nodeVar31 : vec3<f32>;
var<private> nodeVar32 : f32;
var<private> nodeVar33 : vec3<f32>;
var<private> nodeVar34 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar35 : vec3<f32>;
var<private> nodeVar36 : vec3<f32>;
var<private> nodeVar37 : vec3<f32>;
var<private> nodeVar38 : vec3<f32>;
var<private> nodeVar39 : f32;
var<private> nodeVar40 : f32;
var<private> nodeVar41 : f32;
var<private> nodeVar42 : vec3<f32>;
var<private> nodeVar43 : vec3<f32>;
var<private> nodeVar44 : vec3<f32>;
var<private> nodeVar45 : vec3<f32>;
var<private> nodeVar46 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar47 : vec3<f32>;
var<private> nodeVar48 : f32;
var<private> nodeVar49 : f32;
var<private> nodeVar50 : f32;
var<private> nodeVar51 : vec3<f32>;
var<private> nodeVar52 : vec3<f32>;
var<private> nodeVar53 : vec3<f32>;
var<private> nodeVar54 : vec3<f32>;
var<private> nodeVar55 : vec3<f32>;
var<private> nodeVar56 : vec4<f32>;
var<private> nodeVar57 : vec4<f32>;
var<private> nodeVar58 : vec3<f32>;
var<private> nodeVar59 : vec3<f32>;
var<private> nodeVar60 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar61 : f32;
var<private> nodeVar62 : vec4<f32>;
var<private> nodeVar63 : vec3<f32>;
var<private> nodeVar64 : vec3<f32>;
var<private> nodeVar65 : f32;
var<private> nodeVar66 : f32;
var<private> nodeVar67 : vec2<f32>;
var<private> nodeVar68 : f32;
var<private> nodeVar69 : vec2<f32>;
var<private> nodeVar70 : f32;
var<private> nodeVar71 : vec2<f32>;
var<private> nodeVar72 : f32;
var<private> nodeVar73 : vec2<f32>;
var<private> nodeVar74 : f32;
var<private> nodeVar75 : vec2<f32>;
var<private> nodeVar76 : f32;
var<private> nodeVar77 : f32;
var<private> nodeVar78 : vec3<f32>;
var<private> nodeVar79 : vec3<f32>;
var<private> nodeVar80 : vec3<f32>;
var<private> nodeVar81 : vec3<f32>;
var<private> nodeVar82 : vec3<f32>;
var<private> nodeVar83 : vec3<f32>;
var<private> nodeVar84 : f32;
var<private> nodeVar85 : f32;
var<private> nodeVar86 : f32;
var<private> nodeVar87 : vec3<f32>;
var<private> nodeVar88 : vec3<f32>;
var<private> nodeVar89 : vec3<f32>;
var<private> nodeVar90 : vec3<f32>;
var<private> nodeVar91 : vec3<f32>;
var<private> nodeVar92 : vec3<f32>;
var<private> nodeVar93 : f32;
var<private> nodeVar94 : f32;
var<private> nodeVar95 : f32;
var<private> nodeVar96 : vec3<f32>;
var<private> nodeVar97 : vec3<f32>;
var<private> nodeVar98 : vec3<f32>;
var<private> nodeVar99 : vec3<f32>;
var<private> nodeVar100 : vec3<f32>;
var<private> nodeVar101 : vec3<f32>;
var<private> nodeVar102 : f32;
var<private> nodeVar103 : f32;
var<private> nodeVar104 : f32;
var<private> nodeVar105 : f32;
var<private> nodeVar106 : f32;
var<private> nodeVar107 : vec3<f32>;
var<private> nodeVar108 : vec3<f32>;
var<private> nodeVar109 : vec3<f32>;
var<private> nodeVar110 : vec3<f32>;
var<private> nodeVar111 : vec3<f32>;
var<private> nodeVar112 : vec3<f32>;
var<private> nodeVar113 : vec3<f32>;
var<private> nodeVar114 : f32;
var<private> nodeVar115 : f32;
var<private> nodeVar116 : f32;
var<private> nodeVar117 : vec3<f32>;
var<private> nodeVar118 : vec3<f32>;
var<private> nodeVar119 : vec3<f32>;
var<private> nodeVar120 : vec3<f32>;
var<private> nodeVar121 : vec3<f32>;
var<private> nodeVar122 : vec3<f32>;
var<private> nodeVar123 : f32;
var<private> nodeVar124 : f32;
var<private> nodeVar125 : f32;
var<private> nodeVar126 : vec3<f32>;
var<private> nodeVar127 : vec3<f32>;
var<private> nodeVar128 : vec3<f32>;
var<private> nodeVar129 : vec3<f32>;
var<private> nodeVar130 : vec3<f32>;
var<private> nodeVar131 : vec3<f32>;
var<private> nodeVar132 : vec3<f32>;
var<private> nodeVar133 : f32;
var<private> nodeVar134 : vec3<f32>;
var<private> nodeVar135 : vec3<f32>;
var<private> nodeVar136 : vec3<f32>;
var<private> nodeVar137 : vec3<f32>;
var<private> nodeVar138 : vec3<f32>;
var<private> nodeVar139 : vec3<f32>;
var<private> nodeVar140 : vec3<f32>;
var<private> nodeVar141 : f32;
var<private> nodeVar142 : f32;
var<private> nodeVar143 : f32;
var<private> nodeVar144 : vec3<f32>;
var<private> nodeVar145 : vec3<f32>;
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
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar157 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar158 : vec3<f32>;
var<private> nodeVar159 : f32;
var<private> nodeVar160 : vec3<f32>;
var<private> nodeVar161 : vec3<f32>;
var<private> nodeVar162 : vec3<f32>;
var<private> nodeVar163 : vec3<f32>;
var<private> nodeVar164 : vec3<f32>;
var<private> nodeVar165 : vec3<f32>;
var<private> nodeVar166 : vec3<f32>;
var<private> nodeVar167 : f32;
var<private> nodeVar168 : f32;
var<private> nodeVar169 : f32;
var<private> nodeVar170 : vec3<f32>;
var<private> nodeVar171 : vec3<f32>;
var<private> nodeVar172 : vec3<f32>;
var<private> nodeVar173 : vec3<f32>;
var<private> nodeVar174 : vec3<f32>;
var<private> nodeVar175 : vec3<f32>;
var<private> nodeVar176 : vec3<f32>;
var<private> nodeVar177 : f32;
var<private> nodeVar178 : vec3<f32>;
var<private> nodeVar179 : vec3<f32>;
var<private> nodeVar180 : vec3<f32>;
var<private> nodeVar181 : vec3<f32>;
var<private> nodeVar182 : vec3<f32>;
var<private> nodeVar183 : vec3<f32>;
var<private> nodeVar184 : vec3<f32>;
var<private> nodeVar185 : f32;
var<private> nodeVar186 : f32;
var<private> nodeVar187 : f32;
var<private> nodeVar188 : vec3<f32>;
var<private> nodeVar189 : vec3<f32>;
var<private> nodeVar190 : vec3<f32>;
var<private> nodeVar191 : vec3<f32>;
var<private> nodeVar192 : vec3<f32>;
var<private> nodeVar193 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar194 : vec3<f32>;
var<private> nodeVar195 : vec3<f32>;
var<private> nodeVar196 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar197 : vec3<f32>;
var<private> nodeVar198 : vec3<f32>;
var<private> nodeVar199 : vec3<f32>;
var<private> nodeVar200 : vec3<f32>;
var<private> nodeVar201 : vec3<f32>;
var<private> nodeVar202 : vec3<f32>;
var<private> nodeVar203 : vec3<f32>;
var<private> nodeVar204 : vec3<f32>;
var<private> nodeVar205 : vec3<f32>;
var<private> nodeVar206 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar207 : vec3<f32>;
var<private> nodeVar208 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar209 : vec3<f32>;
var<private> nodeVar210 : f32;
var<private> nodeVar211 : f32;
var<private> nodeVar212 : f32;
var<private> nodeVar213 : f32;
var<private> nodeVar214 : f32;
var<private> nodeVar215 : f32;
var<private> nodeVar216 : f32;
var<private> nodeVar217 : f32;
var<private> nodeVar218 : f32;
var<private> nodeVar219 : f32;
var<private> nodeVar220 : f32;
var<private> nodeVar221 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar222 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar223 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar224 : vec3<f32>;
var<private> nodeVar225 : f32;
var<private> nodeVar226 : vec4<f32>;

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
fn main( @location( 0 ) positionLocal : vec3<f32>,
	@location( 1 ) v_positionView : vec3<f32>,
	@location( 2 ) v_positionWorld : vec3<f32>,
	@location( 3 ) v_normalViewGeometry : vec3<f32>,
	@location( 4 ) v_positionViewDirection : vec3<f32>,
	@location( 5 ) nodeVarying7 : vec4<f32>,
	@location( 6 ) nodeVarying8 : vec2<f32>,
	@builtin( position ) fragCoord : vec4<f32> ) -> OutputStruct {

	// flow
	// code

	normalViewGeometry = normalize( v_normalViewGeometry );
	NORMAL_normalView = normalViewGeometry;
	normalView = NORMAL_normalView;
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar0 = mix( -0.11, 1.01, object.nodeUniform4 );
	nodeVar1 = clamp( ( ( ( ( mx_perlin_noise_float_1( ( v_positionWorld * vec3<f32>( 4.2 ) ) ) * 1.0 ) + 0.0 ) * 0.9 ) + 0.5 ), 0.0, 1.0 );
	nodeVar2 = ( 1.0 - smoothstep( nodeVar0, ( nodeVar0 + 0.1 ), nodeVar1 ) );
	nodeVar3 = ( nodeVar2 * nodeVar2 );
	nodeVar4 = mix( ( ( mix( mix( nodeVarying7.xyz, ( ( vec3<f32>( dot( nodeVarying7.xyz, vec3<f32>( 0.2126, 0.7152, 0.0722 ) ) ) * vec3<f32>( 0.9, 1.0, 1.16 ) ) * vec3<f32>( 1.35 ) ), 0.0 ), ( vec3<f32>( 0.19461783043107173, 0.06847816983662762, 0.023153366173251363 ) * vec3<f32>( 0.35 ) ), 0.08 ) * vec3<f32>( 1.25 ) ) + ( vec3<f32>( 0.5, 0.48, 0.45 ) * vec3<f32>( ( smoothstep( 0.55, 1.0, normalWorld.y ) * 0.0 ) ) ) ), vec3<f32>( 0.007499032040460618, 0.005605391621829108, 0.004776953478513362 ), ( nodeVar3 * 0.9 ) );
	DiffuseColor = vec4<f32>( nodeVar4, 1.0 );

	if ( ( nodeVar1 > nodeVar0 ) ) {

		nodeVar5 = 1.0;

	} else {

		nodeVar5 = 0.0;

	}

	DiffuseColor.w = ( DiffuseColor.w * nodeVar5 );

	if ( ( DiffuseColor.w <= object.nodeUniform6 ) ) {

		discard;
		

	}

	DiffuseColor.w = 1.0;
	Metalness = object.nodeUniform7;
	nodeVar6 = max( abs( dpdx( normalViewGeometry ) ), abs( - dpdy( normalViewGeometry ) ) );
	Roughness = min( ( max( object.nodeUniform8, 0.0525 ) + max( max( nodeVar6.x, nodeVar6.y ), nodeVar6.z ) ), 1.0 );
	SpecularColor = vec3<f32>( 0.04, 0.04, 0.04 );
	SpecularColorBlended = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, Metalness );
	SpecularF90 = 1.0;
	DiffuseContribution = ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - object.nodeUniform7 ) ) );
	nodeVar7 = ( positionLocal * vec3<f32>( 5.5 ) );

	if ( ( object.nodeUniform4 > 0.0 ) ) {

		nodeVar8 = 3.2;

	} else {

		nodeVar8 = 0.0;

	}

	nodeVar9 = normalize( normalWorld );
	nodeVar10 = normalize( ( render.cameraPosition - v_positionWorld ) );
	nodeVar11 = pow( ( 1.0 - clamp( dot( nodeVar9, nodeVar10 ), 0.0, 1.0 ) ), 3.0 );
	nodeVar12 = smoothstep( -0.35, 0.55, dot( nodeVar9, object.nodeUniform12 ) );
	nodeVar13 = smoothstep( -0.15, 0.85, ( - dot( nodeVar10, object.nodeUniform12 ) ) );
	EmissiveColor = ( ( ( ( vec3<f32>( 1.0, 0.10224173307914941, 0.0069954101845983935 ) * vec3<f32>( object.nodeUniform9 ) ) * vec3<f32>( ( ( ( ( ( 1.0 - smoothstep( 0.0, 0.032, abs( ( ( mx_perlin_noise_float_1( nodeVar7 ) * 1.0 ) + 0.0 ) ) ) ) * smoothstep( 0.05, 0.5, ( ( mx_perlin_noise_float_1( ( ( nodeVar7 * vec3<f32>( 0.23 ) ) + vec3<f32>( 7.3 ) ) ) * 1.0 ) + 0.0 ) ) ) * 1.1 ) + ( ( ( smoothstep( 0.3, 0.43, positionLocal.x ) * smoothstep( 0.5, 0.64, positionLocal.y ) ) * 0.95 ) + ( ( smoothstep( 0.1, 0.3, positionLocal.x ) * smoothstep( 0.45, 0.62, positionLocal.y ) ) * 0.12 ) ) ) + ( ( 1.0 - smoothstep( -0.25, 0.35, ( ( mx_perlin_noise_float_1( ( ( positionLocal * vec3<f32>( 13.2 ) ) + vec3<f32>( 3.7 ) ) ) * 1.0 ) + 0.0 ) ) ) * 0.03 ) ) ) ) + ( ( vec3<f32>( 1.0, 0.10224173307914941, 0.0069954101845983935 ) * vec3<f32>( smoothstep( 0.35, 1.0, nodeVar2 ) ) ) * vec3<f32>( nodeVar8 ) ) ) + ( mix( vec3<f32>( 0.0, 0.0, 0.0 ), ( ( ( ( ( ( object.nodeUniform10 * vec3<f32>( nodeVar11 ) ) * vec3<f32>( nodeVar12 ) ) * vec3<f32>( ( ( nodeVar13 * 1.38 ) + 0.12 ) ) ) + ( ( ( object.nodeUniform13 * vec3<f32>( nodeVar11 ) ) * vec3<f32>( ( 1.0 - ( nodeVar12 * nodeVar13 ) ) ) ) * vec3<f32>( 0.18 ) ) ) + ( ( object.nodeUniform14 * vec3<f32>( object.nodeUniform15 ) ) * vec3<f32>( mix( ( ( pow( ( 1.0 - abs( dot( nodeVar9, nodeVar10 ) ) ), ( object.nodeUniform16 + 3.0 ) ) * ( object.nodeUniform17 * 6.0 ) ) + ( object.nodeUniform18 * 1.8 ) ), ( ( smoothstep( 0.8, 0.96, nodeVarying8.x ) * ( object.nodeUniform17 * 1.7 ) ) + ( pow( smoothstep( 0.35, 1.0, nodeVarying8.x ), 2.0 ) * ( object.nodeUniform18 * 0.5 ) ) ), object.nodeUniform19 ) ) ) ) + ( ( ( nodeVar4 * vec3<f32>( 0.07 ) ) * vec3<f32>( ( 1.0 - ( smoothstep( 0.0, 0.5, dot( nodeVar4, vec3<f32>( 0.299, 0.587, 0.114 ) ) ) * 0.6 ) ) ) ) + vec3<f32>( 0.006, 0.0055, 0.005 ) ) ), object.nodeUniform20 ) * vec3<f32>( ( 1.0 - nodeVar3 ) ) ) );
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar14 = dot( normalView, positionViewDirection );
	nodeVar15 = textureSample( nodeUniform21, nodeUniform21_sampler, vec2<f32>( Roughness, clamp( nodeVar14, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar15;
	nodeVar16 = ( dfg.x + dfg.y );
	nodeVar17 = ( 1.0 / nodeVar16 );
	nodeVar18 = nodeVar17;
	nodeVar19 = ( nodeVar18 - 1.0 );
	nodeVar20 = ( SpecularColorBlended * vec3<f32>( nodeVar19 ) );
	nodeVar21 = ( nodeVar20 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar21;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar22 = dot( normalWorld, normalize( render.nodeUniform24 ) );
	nodeVar23 = ( nodeVar22 * 0.5 );
	nodeVar24 = ( nodeVar23 + 0.5 );
	nodeVar25 = mix( render.nodeUniform22, render.nodeUniform23, nodeVar24 );
	nodeVar26 = ( irradiance + nodeVar25 );
	irradiance = nodeVar26;
	nodeVar27 = ( render.nodeUniform25 - render.nodeUniform26 );
	nodeVar28 = vec4<f32>( nodeVar27, 0.0 );
	nodeVar29 = ( render.cameraViewMatrix * nodeVar28 );
	nodeVar30 = normalize( nodeVar29.xyz );
	nodeVar31 = nodeVar30;
	nodeVar32 = dot( normalView, nodeVar31 );
	nodeVar33 = ( vec3<f32>( clamp( nodeVar32, 0.0, 1.0 ) ) * render.nodeUniform27 );
	nodeVar34 = nodeVar33;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar35 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar36 = ( nodeVar34 * nodeVar35 );
	nodeVar37 = ( nodeVar31 + positionViewDirection );
	nodeVar38 = normalize( nodeVar37 );
	nodeVar39 = dot( positionViewDirection, nodeVar38 );
	nodeVar40 = clamp( nodeVar39, 0.0, 1.0 );
	nodeVar41 = exp2( ( ( ( nodeVar40 * -5.55473 ) - 6.98316 ) * nodeVar40 ) );
	nodeVar42 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar41 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar41 ) ) );
	nodeVar43 = ( vec3<f32>( 1.0 ) - nodeVar42 );
	nodeVar44 = nodeVar43;
	nodeVar45 = ( nodeVar36 * nodeVar44 );
	nodeVar46 = ( directDiffuse + nodeVar45 );
	directDiffuse = nodeVar46;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar47 = normalize( ( nodeVar31 + positionViewDirection ) );
	nodeVar48 = clamp( dot( positionViewDirection, nodeVar47 ), 0.0, 1.0 );
	nodeVar49 = exp2( ( ( ( nodeVar48 * -5.55473 ) - 6.98316 ) * nodeVar48 ) );
	nodeVar50 = ( Roughness * Roughness );
	nodeVar51 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar49 ) ) ) + vec3<f32>( ( 1.0 * nodeVar49 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar50, clamp( dot( normalView, nodeVar31 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar50, clamp( dot( normalView, nodeVar47 ), 0.0, 1.0 ) ) ) );
	nodeVar52 = ( nodeVar34 * nodeVar51 );
	nodeVar53 = ( nodeVar52 * multiScatteringCompensation );
	nodeVar54 = ( directSpecular + nodeVar53 );
	directSpecular = nodeVar54;
	nodeVar55 = ( render.nodeUniform28 - render.nodeUniform29 );
	nodeVar56 = vec4<f32>( nodeVar55, 0.0 );
	nodeVar57 = ( render.cameraViewMatrix * nodeVar56 );
	nodeVar58 = normalize( nodeVar57.xyz );
	nodeVar59 = nodeVar58;
	nodeVar60 = dot( normalView, nodeVar59 );
	shadowPositionWorld = v_positionWorld;
	nodeVar62 = ( render.nodeUniform31 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform32 ) ) ), 1.0 ) );
	nodeVar63 = ( nodeVar62.xyz / vec3<f32>( nodeVar62.w ) );
	nodeVar64 = vec3<f32>( nodeVar63.x, ( 1.0 - nodeVar63.y ), ( nodeVar63.z + render.nodeUniform33 ) );

	if ( ( ( ( ( ( nodeVar64.x >= 0.0 ) && ( nodeVar64.x <= 1.0 ) ) && ( nodeVar64.y >= 0.0 ) ) && ( nodeVar64.y <= 1.0 ) ) && ( nodeVar64.z <= 1.0 ) ) ) {

		nodeVar65 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar66 = ( render.nodeUniform35 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform36 ).x );
		nodeVar67 = ( nodeVar64.xy + ( vogelDiskSample( 0, 5, nodeVar65 ) * vec2<f32>( nodeVar66 ) ) );
		nodeVar68 = textureSampleCompare( nodeUniform34, nodeUniform34_sampler, nodeVar67, nodeVar64.z );
		nodeVar69 = ( nodeVar64.xy + ( vogelDiskSample( 1, 5, nodeVar65 ) * vec2<f32>( nodeVar66 ) ) );
		nodeVar70 = textureSampleCompare( nodeUniform34, nodeUniform34_sampler, nodeVar69, nodeVar64.z );
		nodeVar71 = ( nodeVar64.xy + ( vogelDiskSample( 2, 5, nodeVar65 ) * vec2<f32>( nodeVar66 ) ) );
		nodeVar72 = textureSampleCompare( nodeUniform34, nodeUniform34_sampler, nodeVar71, nodeVar64.z );
		nodeVar73 = ( nodeVar64.xy + ( vogelDiskSample( 3, 5, nodeVar65 ) * vec2<f32>( nodeVar66 ) ) );
		nodeVar74 = textureSampleCompare( nodeUniform34, nodeUniform34_sampler, nodeVar73, nodeVar64.z );
		nodeVar75 = ( nodeVar64.xy + ( vogelDiskSample( 4, 5, nodeVar65 ) * vec2<f32>( nodeVar66 ) ) );
		nodeVar76 = textureSampleCompare( nodeUniform34, nodeUniform34_sampler, nodeVar75, nodeVar64.z );
		nodeVar61 = ( ( ( ( ( nodeVar68 + nodeVar70 ) + nodeVar72 ) + nodeVar74 ) + nodeVar76 ) * 0.2 );

	} else {

		nodeVar61 = 1.0;

	}

	nodeVar77 = mix( 1.0, nodeVar61, render.nodeUniform37 );
	nodeVar78 = ( vec3<f32>( clamp( nodeVar60, 0.0, 1.0 ) ) * ( render.nodeUniform30 * vec3<f32>( nodeVar77 ) ) );
	nodeVar79 = nodeVar78;
	nodeVar80 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar81 = ( nodeVar79 * nodeVar80 );
	nodeVar82 = ( nodeVar59 + positionViewDirection );
	nodeVar83 = normalize( nodeVar82 );
	nodeVar84 = dot( positionViewDirection, nodeVar83 );
	nodeVar85 = clamp( nodeVar84, 0.0, 1.0 );
	nodeVar86 = exp2( ( ( ( nodeVar85 * -5.55473 ) - 6.98316 ) * nodeVar85 ) );
	nodeVar87 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar86 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar86 ) ) );
	nodeVar88 = ( vec3<f32>( 1.0 ) - nodeVar87 );
	nodeVar89 = nodeVar88;
	nodeVar90 = ( nodeVar81 * nodeVar89 );
	nodeVar91 = ( directDiffuse + nodeVar90 );
	directDiffuse = nodeVar91;
	nodeVar92 = normalize( ( nodeVar59 + positionViewDirection ) );
	nodeVar93 = clamp( dot( positionViewDirection, nodeVar92 ), 0.0, 1.0 );
	nodeVar94 = exp2( ( ( ( nodeVar93 * -5.55473 ) - 6.98316 ) * nodeVar93 ) );
	nodeVar95 = ( Roughness * Roughness );
	nodeVar96 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar94 ) ) ) + vec3<f32>( ( 1.0 * nodeVar94 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar95, clamp( dot( normalView, nodeVar59 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar95, clamp( dot( normalView, nodeVar92 ), 0.0, 1.0 ) ) ) );
	nodeVar97 = ( nodeVar79 * nodeVar96 );
	nodeVar98 = ( nodeVar97 * multiScatteringCompensation );
	nodeVar99 = ( directSpecular + nodeVar98 );
	directSpecular = nodeVar99;
	nodeVar100 = ( render.nodeUniform38 - v_positionView );
	nodeVar101 = normalize( nodeVar100 );
	nodeVar102 = dot( normalView, nodeVar101 );

	if ( ( render.nodeUniform40 > 0.0 ) ) {

		nodeVar104 = length( nodeVar100 );
		nodeVar105 = ( nodeVar104 / render.nodeUniform40 );
		nodeVar106 = clamp( ( 1.0 - ( ( ( nodeVar105 * nodeVar105 ) * nodeVar105 ) * nodeVar105 ) ), 0.0, 1.0 );
		nodeVar103 = ( ( 1.0 / max( pow( nodeVar104, render.nodeUniform41 ), 0.01 ) ) * ( nodeVar106 * nodeVar106 ) );

	} else {

		nodeVar103 = ( 1.0 / max( pow( length( nodeVar100 ), render.nodeUniform41 ), 0.01 ) );

	}

	nodeVar107 = ( render.nodeUniform39 * vec3<f32>( nodeVar103 ) );
	nodeVar108 = ( vec3<f32>( clamp( nodeVar102, 0.0, 1.0 ) ) * nodeVar107 );
	nodeVar109 = nodeVar108;
	nodeVar110 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar111 = ( nodeVar109 * nodeVar110 );
	nodeVar112 = ( nodeVar101 + positionViewDirection );
	nodeVar113 = normalize( nodeVar112 );
	nodeVar114 = dot( positionViewDirection, nodeVar113 );
	nodeVar115 = clamp( nodeVar114, 0.0, 1.0 );
	nodeVar116 = exp2( ( ( ( nodeVar115 * -5.55473 ) - 6.98316 ) * nodeVar115 ) );
	nodeVar117 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar116 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar116 ) ) );
	nodeVar118 = ( vec3<f32>( 1.0 ) - nodeVar117 );
	nodeVar119 = nodeVar118;
	nodeVar120 = ( nodeVar111 * nodeVar119 );
	nodeVar121 = ( directDiffuse + nodeVar120 );
	directDiffuse = nodeVar121;
	nodeVar122 = normalize( ( nodeVar101 + positionViewDirection ) );
	nodeVar123 = clamp( dot( positionViewDirection, nodeVar122 ), 0.0, 1.0 );
	nodeVar124 = exp2( ( ( ( nodeVar123 * -5.55473 ) - 6.98316 ) * nodeVar123 ) );
	nodeVar125 = ( Roughness * Roughness );
	nodeVar126 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar124 ) ) ) + vec3<f32>( ( 1.0 * nodeVar124 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar125, clamp( dot( normalView, nodeVar101 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar125, clamp( dot( normalView, nodeVar122 ), 0.0, 1.0 ) ) ) );
	nodeVar127 = ( nodeVar109 * nodeVar126 );
	nodeVar128 = ( nodeVar127 * multiScatteringCompensation );
	nodeVar129 = ( directSpecular + nodeVar128 );
	directSpecular = nodeVar129;
	nodeVar130 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar131 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar132 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar133 = ( SpecularF90 * dfg.y );
	nodeVar134 = ( nodeVar132 + vec3<f32>( nodeVar133 ) );
	nodeVar135 = ( nodeVar130 + nodeVar134 );
	nodeVar130 = nodeVar135;
	nodeVar136 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar137 = nodeVar136;
	nodeVar138 = ( nodeVar137 * vec3<f32>( 0.047619 ) );
	nodeVar139 = ( SpecularColor + nodeVar138 );
	nodeVar140 = ( nodeVar134 * nodeVar139 );
	nodeVar141 = ( dfg.x + dfg.y );
	nodeVar142 = ( 1.0 - nodeVar141 );
	nodeVar143 = nodeVar142;
	nodeVar144 = ( vec3<f32>( nodeVar143 ) * nodeVar139 );
	nodeVar145 = ( vec3<f32>( 1.0 ) - nodeVar144 );
	nodeVar146 = nodeVar145;
	nodeVar147 = ( nodeVar140 / nodeVar146 );
	nodeVar148 = ( nodeVar147 * vec3<f32>( nodeVar143 ) );
	nodeVar149 = ( nodeVar131 + nodeVar148 );
	nodeVar131 = nodeVar149;
	nodeVar150 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar151 = ( irradiance * nodeVar150 );
	nodeVar152 = ( nodeVar130 + nodeVar131 );
	nodeVar153 = ( vec3<f32>( 1.0 ) - nodeVar152 );
	nodeVar154 = nodeVar153;
	nodeVar155 = ( nodeVar151 * nodeVar154 );
	nodeVar156 = nodeVar155;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar157 = ( indirectDiffuse + nodeVar156 );
	indirectDiffuse = nodeVar157;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar158 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar159 = ( SpecularF90 * dfg.y );
	nodeVar160 = ( nodeVar158 + vec3<f32>( nodeVar159 ) );
	nodeVar161 = ( singleScatteringDielectric + nodeVar160 );
	singleScatteringDielectric = nodeVar161;
	nodeVar162 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar163 = nodeVar162;
	nodeVar164 = ( nodeVar163 * vec3<f32>( 0.047619 ) );
	nodeVar165 = ( SpecularColor + nodeVar164 );
	nodeVar166 = ( nodeVar160 * nodeVar165 );
	nodeVar167 = ( dfg.x + dfg.y );
	nodeVar168 = ( 1.0 - nodeVar167 );
	nodeVar169 = nodeVar168;
	nodeVar170 = ( vec3<f32>( nodeVar169 ) * nodeVar165 );
	nodeVar171 = ( vec3<f32>( 1.0 ) - nodeVar170 );
	nodeVar172 = nodeVar171;
	nodeVar173 = ( nodeVar166 / nodeVar172 );
	nodeVar174 = ( nodeVar173 * vec3<f32>( nodeVar169 ) );
	nodeVar175 = ( multiScatteringDielectric + nodeVar174 );
	multiScatteringDielectric = nodeVar175;
	nodeVar176 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar177 = ( SpecularF90 * dfg.y );
	nodeVar178 = ( nodeVar176 + vec3<f32>( nodeVar177 ) );
	nodeVar179 = ( singleScatteringMetallic + nodeVar178 );
	singleScatteringMetallic = nodeVar179;
	nodeVar180 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar181 = nodeVar180;
	nodeVar182 = ( nodeVar181 * vec3<f32>( 0.047619 ) );
	nodeVar183 = ( DiffuseColor.xyz + nodeVar182 );
	nodeVar184 = ( nodeVar178 * nodeVar183 );
	nodeVar185 = ( dfg.x + dfg.y );
	nodeVar186 = ( 1.0 - nodeVar185 );
	nodeVar187 = nodeVar186;
	nodeVar188 = ( vec3<f32>( nodeVar187 ) * nodeVar183 );
	nodeVar189 = ( vec3<f32>( 1.0 ) - nodeVar188 );
	nodeVar190 = nodeVar189;
	nodeVar191 = ( nodeVar184 / nodeVar190 );
	nodeVar192 = ( nodeVar191 * vec3<f32>( nodeVar187 ) );
	nodeVar193 = ( multiScatteringMetallic + nodeVar192 );
	multiScatteringMetallic = nodeVar193;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar194 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar195 = ( radiance * nodeVar194 );
	nodeVar196 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar197 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar198 = ( nodeVar196 * nodeVar197 );
	nodeVar199 = ( nodeVar195 + nodeVar198 );
	nodeVar200 = nodeVar199;
	nodeVar201 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar202 = ( vec3<f32>( 1.0 ) - nodeVar201 );
	nodeVar203 = nodeVar202;
	nodeVar204 = ( DiffuseContribution * nodeVar203 );
	nodeVar205 = ( nodeVar204 * nodeVar197 );
	nodeVar206 = nodeVar205;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar207 = ( indirectSpecular + nodeVar200 );
	indirectSpecular = nodeVar207;
	nodeVar208 = ( indirectDiffuse + nodeVar206 );
	indirectDiffuse = nodeVar208;
	ambientOcclusion = 1.0;
	nodeVar209 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar209;
	nodeVar210 = dot( normalView, positionViewDirection );
	nodeVar211 = ( clamp( nodeVar210, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar212 = ( Roughness * -16.0 );
	nodeVar213 = ( 1.0 - nodeVar212 );
	nodeVar214 = nodeVar213;
	nodeVar215 = ( - nodeVar214 );
	nodeVar216 = exp2( nodeVar215 );
	nodeVar217 = pow( nodeVar211, nodeVar216 );
	nodeVar218 = ( 1.0 - nodeVar217 );
	nodeVar219 = nodeVar218;
	nodeVar220 = ( ambientOcclusion - nodeVar219 );
	nodeVar221 = ( indirectSpecular * vec3<f32>( clamp( nodeVar220, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar221;
	nodeVar222 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar222;
	nodeVar223 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar223;
	nodeVar224 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar224;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar225 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar226 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform42, object.nodeUniform43, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform44 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform45 * object.nodeUniform45 ) * nodeVar225 ) * nodeVar225 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar226;

	// result

	output.color = nodeVar226;

	return output;

}
